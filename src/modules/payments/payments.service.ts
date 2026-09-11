import { paystack } from '../../providers/payments.js'
import { pricingService } from '../pricing/pricing.service.js'
import { ledgerRepository } from './ledger.repository.js'
import { walletService } from './wallet.service.js'
import { ridesService } from '../rides/rides.service.js'
import { errors } from '../../lib/errors.js'
import { assertIdempotent } from '../../lib/idempotency.js'
import { v4 as uuid } from 'uuid'

const PLATFORM_FEE_PERCENT = 0.08 // 8%

export const paymentsService = {
  async initializePayment(params: {
    riderId: string
    tripId: string
    amountKobo: number
    email: string
    metadata?: Record<string, unknown>
  }) {
    const idempotencyKey = `payment:${params.tripId}:${params.riderId}`
    await assertIdempotent(idempotencyKey)

    const reference = `trip_${params.tripId}_${Date.now()}`

    const result = await paystack.initialize(
      params.email,
      params.amountKobo,
      reference,
      { ...params.metadata, tripId: params.tripId, riderId: params.riderId },
    )

    return {
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    }
  },

  async initializeWalletTopup(params: {
    ownerId: string
    ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner'
    amountKobo: number
    email: string
  }) {
    const idempotencyKey = `wallet_topup:${params.ownerId}:${params.amountKobo}:${Date.now()}`
    const reference = `topup_${params.ownerId}_${Date.now()}`

    const result = await paystack.initialize(
      params.email,
      params.amountKobo,
      reference,
      {
        context: 'wallet_topup',
        ownerId: params.ownerId,
        ownerType: params.ownerType,
      },
      // All channels enabled — card, bank_transfer, ussd, mobile_money
    )

    return {
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
      channels: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
    }
  },

  async verifyPayment(reference: string) {
    const result = await paystack.verify(reference)
    return result
  },

  async handlePaystackWebhook(payload: any, signature: string) {
    // Verify webhook signature (simplified - in production use crypto)
    const eventType = payload.event
    const data = payload.data

    // Idempotency key from provider reference
    const idempotencyKey = `paystack_webhook:${eventType}:${data.reference || data.id}`
    
    try {
      await assertIdempotent(idempotencyKey)
    } catch {
      // Already processed
      return { received: true, duplicate: true }
    }

    switch (eventType) {
      case 'charge.success':
        await this.handleChargeSuccess(data)
        break
      case 'charge.failed':
        await this.handleChargeFailed(data)
        break
      case 'transfer.success':
        await this.handleTransferSuccess(data)
        break
      case 'transfer.failed':
        await this.handleTransferFailed(data)
        break
      case 'refund.processed':
        await this.handleRefundProcessed(data)
        break
    }

    return { received: true }
  },

  async handleChargeSuccess(data: any) {
    const reference = data.reference
    const amountKobo = data.amount
    const metadata = data.metadata || {}

    // --- Wallet top-up via card or bank transfer ---
    if (metadata.context === 'wallet_topup') {
      const { ownerId, ownerType } = metadata as { ownerId: string; ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner' }
      if (!ownerId || !ownerType) {
        console.error('wallet_topup webhook missing ownerId/ownerType', { reference })
        return
      }
      await walletService.topUp(ownerId, ownerType, amountKobo, reference, `Wallet top-up via ${data.channel ?? 'card'}`)
      return
    }

    // --- Trip payment ---
    const tripId = metadata.tripId
    const riderId = metadata.riderId

    if (!tripId || !riderId) {
      console.error('Missing tripId or riderId in payment metadata', { reference, metadata })
      return
    }

    const trip = await ridesService.getTrip(tripId)
    if (!trip) throw errors.notFound('Trip not found')

    const platformFeeKobo = Math.round(amountKobo * PLATFORM_FEE_PERCENT)
    const driverAmountKobo = amountKobo - platformFeeKobo
    const correlationId = uuid()

    await ledgerRepository.createDoubleEntry({
      correlationId,
      debitAccount: 'rider_wallet',
      creditAccount: 'platform_revenue',
      amountKobo: platformFeeKobo,
      currency: 'NGN',
      description: `Platform fee for trip ${tripId}`,
      referenceId: tripId,
      referenceType: 'trip',
      actorId: riderId,
      metadata: { paymentReference: reference },
    })

    await ledgerRepository.createDoubleEntry({
      correlationId: `${correlationId}_driver`,
      debitAccount: 'rider_wallet',
      creditAccount: 'driver_payable',
      amountKobo: driverAmountKobo,
      currency: 'NGN',
      description: `Driver payable for trip ${tripId}`,
      referenceId: tripId,
      referenceType: 'trip',
      actorId: riderId,
      metadata: { paymentReference: reference, driverId: trip.driverId },
    })

    await ridesService.completeTrip(tripId, trip.driverId!, trip.distanceMeters!, trip.durationSeconds!)
  },

  async handleChargeFailed(data: any) {
    const reference = data.reference
    const metadata = data.metadata || {}
    const tripId = metadata.tripId

    if (tripId) {
      // Log failure, notify rider
      console.log(`Payment failed for trip ${tripId}: ${reference}`)
    }
  },

  async handleTransferSuccess(data: any) {
    // Paystack fires this for both outbound payouts AND inbound bank transfers
    // Inbound bank transfers (wallet top-up) carry context in metadata
    const reference = data.reference
    const metadata = data.metadata || {}

    if (metadata.context === 'wallet_topup') {
      const { ownerId, ownerType } = metadata as { ownerId: string; ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner' }
      if (!ownerId || !ownerType) {
        console.error('wallet_topup transfer.success missing ownerId/ownerType', { reference })
        return
      }
      await walletService.topUp(ownerId, ownerType, data.amount, reference, 'Wallet top-up via bank transfer')
      return
    }

    // Outbound payout to driver — log confirmation
    console.log(`Outbound transfer successful: ${reference}`)
  },

  async handleTransferFailed(data: any) {
    // Payout to driver failed
    const reference = data.reference
    console.error(`Transfer failed: ${reference}`)
  },

  async handleRefundProcessed(data: any) {
    const reference = data.reference
    const amountKobo = data.amount
    console.log(`Refund processed: ${reference} - ${amountKobo} kobo`)
  },

  async refundPayment(reference: string, amountKobo?: number) {
    return paystack.refund(reference, amountKobo)
  },

  async createDriverPayout(driverId: string, amountKobo: number, settlementCycleId: string) {
    const idempotencyKey = `payout:${driverId}:${settlementCycleId}`
    await assertIdempotent(idempotencyKey)

    // In production, get driver's Paystack recipient code
    const recipientCode = `RCP_${driverId}` // placeholder

    const reference = `payout_${driverId}_${settlementCycleId}_${Date.now()}`

    const result = await paystack.transfer(
      amountKobo,
      recipientCode,
      reference,
      `Settlement payout for cycle ${settlementCycleId}`
    )

    // Create ledger entries for payout
    await ledgerRepository.createDoubleEntry({
      correlationId: uuid(),
      debitAccount: 'payout_clearing',
      creditAccount: 'driver_payable',
      amountKobo,
      currency: 'NGN',
      description: `Payout to driver ${driverId} for cycle ${settlementCycleId}`,
      referenceId: driverId,
      referenceType: 'payout',
      actorId: driverId,
      metadata: { transferReference: result.transfer_code, settlementCycleId },
    })

    return result
  },
}