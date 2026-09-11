import { ridesRepository } from '../rides/rides.repository.js'
import { errors } from '../../lib/errors.js'
import { enqueue } from '../../queues/enqueue.js'

const MAX_DISPATCH_ATTEMPTS = 3
const OFFER_BATCH_SIZE = 3
const RETRY_DELAY_MS = 5000

export const dispatchService = {
  /**
   * Entry point. Called after a trip is created or after all offers in a batch
   * are declined/expired.
   */
  async dispatch(tripId: string): Promise<{ status: string; attempt?: number; offers?: unknown[] }> {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.status !== 'requested' && trip.status !== 'matched') {
      throw errors.unprocessable(`Trip cannot be dispatched in status: ${trip.status}`)
    }

    const attemptNumber = (await ridesRepository.getDispatchAttemptCount(tripId)) + 1

    if (attemptNumber > MAX_DISPATCH_ATTEMPTS) {
      await ridesRepository.updateStatus(tripId, 'cancelled', 'system', 'system', {
        reason: 'No drivers available after maximum dispatch attempts',
      })
      await ridesRepository.recordDispatchAttempt({
        tripId,
        attemptNumber,
        driversContacted: 0,
        outcome: 'exhausted',
      })
      return { status: 'cancelled', attempt: attemptNumber }
    }

    const candidates = await this.findCandidates(trip.pickupLat, trip.pickupLng)

    if (candidates.length === 0) {
      await ridesRepository.recordDispatchAttempt({
        tripId,
        attemptNumber,
        driversContacted: 0,
        outcome: 'no_drivers',
      })
      // Schedule retry
      setTimeout(() => this.dispatch(tripId).catch(console.error), RETRY_DELAY_MS)
      return { status: 'retrying', attempt: attemptNumber }
    }

    const batch = candidates.slice(0, OFFER_BATCH_SIZE)
    const offers = []

    for (const driver of batch) {
      const offer = await ridesRepository.createOffer({
        tripId,
        driverId: driver.id,
        estimatedPickupSeconds: this.estimatePickupSeconds(driver.distanceMeters),
        driverLat: driver.currentLat!,
        driverLng: driver.currentLng!,
      })
      if (offer) {
        offers.push(offer)
        // Notify driver via push/WS
        await enqueue.notification({
          userId: driver.userId,
          templateId: 'driver_offer',
          channel: 'push',
          variables: { offerId: offer.id, tripId },
        })
      }
    }

    await ridesRepository.recordDispatchAttempt({
      tripId,
      attemptNumber,
      driversContacted: offers.length,
      outcome: 'pending',
    })

    await ridesRepository.updateStatus(tripId, 'matched', 'system', 'system', {
      offerIds: offers.map((o) => (o as any).id),
    })

    return { status: 'matched', attempt: attemptNumber, offers }
  },

  /**
   * Called when all offers in a batch expire or are declined without an
   * acceptance. Re-enters the dispatch loop.
   */
  async redispatch(tripId: string) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) return
    if (trip.status === 'cancelled' || trip.status === 'completed') return

    // Reset to requested so dispatch() guard passes
    await ridesRepository.updateStatus(tripId, 'requested', 'system', 'system', {
      reason: 'Redispatching after offer batch exhausted',
    })

    return this.dispatch(tripId)
  },

  /**
   * Find and rank nearby available drivers.
   *
   * Ranking factors (in order of weight):
   *   1. ETA (distance proxy)
   *   2. Driver rating
   *   3. Total trips (experience)
   */
  async findCandidates(lat: number, lng: number, radiusKm = 5, limit = 10) {
    const drivers = await ridesRepository.findNearbyDrivers(lat, lng, radiusKm, limit * 2)

    return drivers
      .map((d) => ({
        ...d,
        score: this.scoreDriver(d),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  },

  scoreDriver(driver: {
    distanceMeters: number
    rating: number
    totalTrips: string
  }): number {
    const etaScore = Math.max(0, 1 - driver.distanceMeters / 5000) // 0–1, closer = higher
    const ratingScore = (driver.rating - 1) / 4 // normalise 1–5 → 0–1
    const experienceScore = Math.min(parseInt(driver.totalTrips, 10) / 500, 1) // cap at 500 trips

    return etaScore * 0.6 + ratingScore * 0.3 + experienceScore * 0.1
  },

  estimatePickupSeconds(distanceMeters: number): number {
    // Assume average 20 km/h in Lagos traffic
    return Math.round((distanceMeters / 1000 / 20) * 3600)
  },
}
