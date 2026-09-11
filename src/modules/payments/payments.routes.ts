import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../lib/rbac.js'
import {
  initializePaymentSchema,
  walletTopupSchema,
  webhookSchema,
  refundSchema,
  driverPayoutSchema,
  type InitializePaymentBody,
  type WalletTopupBody,
  type WebhookBody,
  type RefundBody,
  type DriverPayoutBody,
} from './payments.schema.js'
import { paymentsService } from './payments.service.js'
import { walletService } from './wallet.service.js'
import { env } from '../../config/env.js'
import crypto from 'crypto'

export async function paymentRoutes(app: FastifyInstance) {
  // Initialize payment for a trip
  app.post<{ Body: InitializePaymentBody }>(
    '/initialize',
    { preHandler: [authenticate, authorize('rider')] },
    async (req) => {
      const body = initializePaymentSchema.parse(req.body)
      
      // Get trip to verify ownership and get amount
      // In production, fetch trip and calculate amount
      const amountKobo = 500000 // placeholder - 5000 NGN
      
      return paymentsService.initializePayment({
        riderId: req.user.sub,
        tripId: body.tripId,
        amountKobo,
        email: body.email,
        metadata: body.metadata,
      })
    }
  )

  // Verify payment
  app.get('/verify/:reference', { preHandler: [authenticate, authorize('rider')] }, async (req) => {
    const { reference } = req.params as { reference: string }
    return paymentsService.verifyPayment(reference)
  })

  // Refund
  app.post<{ Body: RefundBody }>('/refund', { preHandler: [authenticate, authorize('admin')] }, async (req) => {
    const body = refundSchema.parse(req.body)
    return paymentsService.refundPayment(body.reference, body.amountKobo)
  })

  // Driver payout (admin)
  app.post<{ Body: DriverPayoutBody }>('/payout/driver', { preHandler: [authenticate, authorize('admin')] }, async (req) => {
    const body = driverPayoutSchema.parse(req.body)
    return paymentsService.createDriverPayout(body.driverId, body.amountKobo, body.settlementCycleId)
  })

  // Wallet balance
  app.get('/wallet/balance', { preHandler: [authenticate] }, async (req) => {
    const role = req.user.role as 'rider' | 'driver' | 'corporate' | 'fleet_owner'
    return walletService.getBalance(req.user.sub, role)
  })

  // Wallet transactions
  app.get('/wallet/transactions', { preHandler: [authenticate] }, async (req) => {
    const { limit, offset } = req.query as { limit?: string; offset?: string }
    const role = req.user.role as 'rider' | 'driver' | 'corporate' | 'fleet_owner'
    return walletService.getWalletTransactions(req.user.sub, role, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0)
  })

  // Initialize wallet top-up — returns Paystack checkout URL
  // Supports card, bank transfer, USSD and mobile money
  app.post<{ Body: WalletTopupBody }>(
    '/wallet/topup/initialize',
    { preHandler: [authenticate] },
    async (req) => {
      const { amountKobo, email } = walletTopupSchema.parse(req.body)
      const ownerType = req.user.role as 'rider' | 'driver' | 'corporate' | 'fleet_owner'
      return paymentsService.initializeWalletTopup({
        ownerId: req.user.sub,
        ownerType,
        amountKobo,
        email,
      })
    }
  )

  // Top up wallet directly (internal use — called after webhook confirms payment)
  app.post<{ Body: { amountKobo: number; reference: string; description: string } }>(
    '/wallet/topup',
    { preHandler: [authenticate] },
    async (req) => {
      const { amountKobo, reference, description } = req.body
      const role = req.user.role as 'rider' | 'driver' | 'corporate' | 'fleet_owner'
      return walletService.topUp(req.user.sub, role, amountKobo, reference, description)
    }
  )

  // Withdraw from wallet
  app.post<{ Body: { amountKobo: number; reference: string; description: string } }>(
    '/wallet/withdraw',
    { preHandler: [authenticate] },
    async (req) => {
      const { amountKobo, reference, description } = req.body
      const role = req.user.role as 'rider' | 'driver' | 'corporate' | 'fleet_owner'
      return walletService.withdraw(req.user.sub, role, amountKobo, reference, description)
    }
  )

  // Paystack webhook (no auth, verified by HMAC-SHA512 signature)
  // Handles: charge.success (card + bank transfer), transfer.success (payouts + inbound transfers)
  app.post<{ Body: WebhookBody }>('/webhooks/paystack', async (req, reply) => {
    const signature = req.headers['x-paystack-signature'] as string
    if (!signature) return reply.status(400).send({ error: 'Missing signature' })

    const rawBody = JSON.stringify(req.body)
    const expectedSignature = crypto
      .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSignature) {
      return reply.status(400).send({ error: 'Invalid signature' })
    }

    // Acknowledge immediately — Paystack expects 200 within 5s
    reply.status(200).send({ received: true })

    // Process asynchronously after response sent
    paymentsService.handlePaystackWebhook(req.body, signature).catch((err) => {
      console.error('Webhook processing error:', err)
    })
  })
}