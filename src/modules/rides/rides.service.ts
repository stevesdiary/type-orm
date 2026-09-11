import { ridesRepository } from './rides.repository.js'
import { pricingService } from '../pricing/pricing.service.js'
import { dispatchService } from '../dispatch/dispatch.service.js'
import { maps } from '../../providers/maps.js'
import { errors } from '../../lib/errors.js'

const CANCELLATION_FEE_KOBO = 5000 // ₦50

export interface CreateTripParams {
  riderId: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  destinationAddress: string
  destinationLat: number
  destinationLng: number
  paymentMethod: 'card' | 'wallet' | 'cash' | 'bank_transfer' | 'corporate_wallet'
  quoteId: string
  mode?: 'immediate' | 'scheduled'
  scheduledFor?: Date
}

export const ridesService = {
  async createTrip(params: CreateTripParams) {
    // Validate and consume quote
    const quote = await pricingService.validateQuote(params.quoteId)
    if (quote.riderId !== params.riderId && quote.riderId !== 'anonymous') {
      throw errors.forbidden('Quote does not belong to rider')
    }

    // Get route details from maps
    const route = await maps.getRoute(
      { lat: params.pickupLat, lng: params.pickupLng },
      { lat: params.destinationLat, lng: params.destinationLng }
    )

    await pricingService.consumeQuote(params.quoteId)

    const trip = await ridesRepository.create({
      riderId: params.riderId,
      pickupAddress: params.pickupAddress,
      pickupLat: params.pickupLat,
      pickupLng: params.pickupLng,
      destinationAddress: params.destinationAddress,
      destinationLat: params.destinationLat,
      destinationLng: params.destinationLng,
      estimatedFareKobo: quote.estimatedFareKobo,
      platformFeeKobo: quote.breakdown.platformFeeKobo,
      driverAmountKobo: quote.breakdown.driverAmountKobo,
      surgeMultiplier: quote.breakdown.surgeMultiplier,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      paymentMethod: params.paymentMethod,
      quoteId: params.quoteId,
      mode: params.mode ?? 'immediate',
      scheduledFor: params.scheduledFor,
    })

    // If immediate, start dispatch
    if (trip && (!params.scheduledFor || params.mode === 'immediate')) {
      await dispatchService.dispatch(trip.id)
    }

    return trip
  },

  async dispatchTrip(tripId: string) {
    return dispatchService.dispatch(tripId)
  },

  async acceptOffer(offerId: string, driverId: string) {
    const offer = await ridesRepository.respondToOffer(offerId, driverId, true)
    if (!offer) throw errors.notFound('Offer not found after acceptance')
    const trip = await ridesRepository.findById(offer.tripId)
    if (!trip) throw errors.notFound('Trip not found')

    // Expire other offers for this trip
    await ridesRepository.expireOffersForTrip(trip.id)

    // Assign driver
    await ridesRepository.updateTrip(trip.id, { driverId })

    // Update status to driver_arriving
    await ridesRepository.updateStatus(trip.id, 'driver_arriving', driverId, 'driver', { offerId })

    // Notify rider via WebSocket (handled by WS module)
    return { tripId: trip.id, status: 'driver_arriving' }
  },

  async declineOffer(offerId: string, driverId: string, reason?: string) {
    const offer = await ridesRepository.respondToOffer(offerId, driverId, false, reason)
    if (!offer) throw errors.notFound('Offer not found after decline')
    const trip = await ridesRepository.findById(offer.tripId)
    if (!trip) throw errors.notFound('Trip not found')

    // Check if all offers are exhausted
    const pendingOffers = await ridesRepository.getPendingOffersForTrip(trip.id)
    if (pendingOffers.length === 0) {
      return dispatchService.redispatch(trip.id)
    }

    return { reDispatched: false }
  },

  async driverArrived(tripId: string, driverId: string) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.driverId !== driverId) throw errors.forbidden('Not your trip')
    if (trip.status !== 'driver_arriving') throw errors.unprocessable('Trip not in driver_arriving state')

    await ridesRepository.updateStatus(tripId, 'driver_arrived', driverId, 'driver')
    return { tripId, status: 'driver_arrived' }
  },

  async verifyPinAndStart(tripId: string, pin: string, actorId: string) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.status !== 'driver_arrived') throw errors.unprocessable('Trip not in driver_arrived state')

    const valid = await ridesRepository.verifyPin(tripId, pin)
    if (!valid) throw errors.unauthorized('Invalid or already used PIN')

    await ridesRepository.markPinVerified(tripId)
    await ridesRepository.updateStatus(tripId, 'in_progress', actorId, 'driver')
    return { tripId, status: 'in_progress' }
  },

  async completeTrip(tripId: string, driverId: string, finalDistanceMeters: number, finalDurationSeconds: number) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.driverId !== driverId) throw errors.forbidden('Not your trip')
    if (trip.status !== 'in_progress') throw errors.unprocessable('Trip not in progress')

    // For now use estimated fare - in production recalculate based on actual distance/time
    const finalFareKobo = trip.estimatedFareKobo ?? 0
    const platformFeeKobo = trip.platformFeeKobo ?? 0
    const driverAmountKobo = trip.driverAmountKobo ?? 0

    await ridesRepository.updateTrip(tripId, {
      finalFareKobo,
      distanceMeters: finalDistanceMeters,
      durationSeconds: finalDurationSeconds,
    })

    await ridesRepository.updateStatus(tripId, 'completed', driverId, 'driver')
    return { tripId, status: 'completed', finalFareKobo, driverAmountKobo }
  },

  async cancelTrip(tripId: string, actorId: string, actorType: 'rider' | 'driver' | 'system', reason: string) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')

    const terminalStates = ['completed', 'cancelled']
    if (terminalStates.includes(trip.status)) throw errors.unprocessable('Trip already completed or cancelled')

    // Determine cancellation fee
    let cancellationFeeKobo = 0
    if (actorType === 'rider' && ['matched', 'driver_arriving', 'driver_arrived'].includes(trip.status)) {
      cancellationFeeKobo = CANCELLATION_FEE_KOBO
    }

    await ridesRepository.updateTrip(tripId, {
      cancellationReason: reason,
      cancelledBy: actorType,
    })

    await ridesRepository.updateStatus(tripId, 'cancelled', actorId, actorType, { reason, cancellationFeeKobo })

    // Expire any pending offers
    await ridesRepository.expireOffersForTrip(tripId)

    return { tripId, status: 'cancelled', cancellationFeeKobo }
  },

  async addStop(tripId: string, actorId: string, address: string, lat: number, lng: number) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (!['driver_arriving', 'driver_arrived', 'in_progress'].includes(trip.status)) {
      throw errors.unprocessable('Cannot add stop at this trip stage')
    }

    const existingStops = await ridesRepository.getStops(tripId)
    const sequence = existingStops.length + 1

    const stop = await ridesRepository.addStop(tripId, sequence, address, lat, lng)
    if (stop) {
      await ridesRepository.logEvent(tripId, 'stop_added', actorId, 'rider', { stopId: stop.id, sequence })
    }

    // Recalculate fare if needed (TODO: Phase 6 - fare recalculation)
    return stop
  },

  async updateDestination(tripId: string, actorId: string, destinationAddress: string, destinationLat: number, destinationLng: number) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.status !== 'in_progress') throw errors.unprocessable('Can only update destination during trip')

    const route = await maps.getRoute(
      { lat: trip.pickupLat, lng: trip.pickupLng },
      { lat: destinationLat, lng: destinationLng }
    )

    // Fare recalculation would happen here
    await ridesRepository.updateTrip(tripId, {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    })

    await ridesRepository.logEvent(tripId, 'destination_updated', actorId, 'rider', { newDestination: destinationAddress })

    return { tripId, newFareKobo: trip.estimatedFareKobo ?? 0 } // TODO: actual recalculation
  },

  async rateTrip(
    tripId: string,
    actorId: string,
    actorType: 'rider' | 'driver',
    rating: number,
    comment?: string,
    tipKobo?: number,
  ) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.status !== 'completed') throw errors.unprocessable('Can only rate completed trips')

    const existingRating = await ridesRepository.getRating(tripId)
    if (existingRating) throw errors.conflict('Trip already rated')

    if (actorType === 'rider' && trip.riderId !== actorId) throw errors.forbidden('Not your trip')
    if (actorType === 'driver' && trip.driverId !== actorId) throw errors.forbidden('Not your trip')

    const data = actorType === 'rider'
      ? { driverRating: rating, driverComment: comment }
      : { riderRating: rating, riderComment: comment }

    const ratingRecord = await ridesRepository.createRating(tripId, data)
    if (actorType === 'rider' && tipKobo && tipKobo > 0) {
      await ridesRepository.updateTrip(tripId, { tipKobo })
      await ridesRepository.logEvent(tripId, 'tipped', actorId, actorType, { tipKobo })
    }
    await ridesRepository.logEvent(tripId, 'rated', actorId, actorType, { rating, comment, tipKobo })

    return ratingRecord
  },

  async getTrip(tripId: string) {
    const trip = await ridesRepository.findById(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    return trip
  },

  async getTripForRider(tripId: string, riderId: string) {
    const trip = await ridesRepository.findByIdForRider(tripId)
    if (!trip) throw errors.notFound('Trip not found')
    if (trip.riderId !== riderId) throw errors.forbidden('Not your trip')
    return trip
  },

  async listTrips(riderId: string, limit = 20, offset = 0) {
    return ridesRepository.findByRiderId(riderId, limit, offset)
  },

  async listDriverTrips(driverId: string, limit = 20, offset = 0) {
    return ridesRepository.findByDriverId(driverId, limit, offset)
  },
}