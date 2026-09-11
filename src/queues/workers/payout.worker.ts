import { Worker } from 'bullmq'
import { bullConnection } from '../connection.js'
import { paymentsService } from '../../modules/payments/payments.service.js'
import { ledgerRepository } from '../../modules/payments/ledger.repository.js'

/**
 * Processes a single driver payout.
 * Reads the driver's net payable balance, initiates a Paystack transfer,
 * and records the debit against driver_payable.
 */
export const payoutWorker = new Worker(
  'payout',
  async (job) => {
    const { driverId, settlementCycleId } = job.data as {
      driverId: string
      settlementCycleId: string
    }

    job.log(`Processing payout for driver ${driverId}, cycle ${settlementCycleId}`)

    // Get current payable balance
    const balance = await ledgerRepository.getWalletBalance(driverId, 'driver')

    if (balance.balanceKobo <= 0) {
      job.log(`Driver ${driverId} has no payable balance — skipping`)
      return { skipped: true, reason: 'zero_balance' }
    }

    // Minimum payout threshold: ₦500 (50000 kobo)
    const MIN_PAYOUT_KOBO = 50_000
    if (balance.balanceKobo < MIN_PAYOUT_KOBO) {
      job.log(`Driver ${driverId} balance ${balance.balanceKobo} below minimum — skipping`)
      return { skipped: true, reason: 'below_minimum', balanceKobo: balance.balanceKobo }
    }

    const result = await paymentsService.createDriverPayout(
      driverId,
      balance.balanceKobo,
      settlementCycleId,
    )

    job.log(`Payout initiated: ${result.transfer_code}`)
    return { success: true, transferCode: result.transfer_code, amountKobo: balance.balanceKobo }
  },
  { connection: bullConnection, concurrency: 5 },
)
