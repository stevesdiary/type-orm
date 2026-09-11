import { Worker } from 'bullmq'
import { bullConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { ledgerEntries } from '../../db/schema/index.js'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { enqueue } from '../enqueue.js'
import { v4 as uuid } from 'uuid'

/**
 * Runs on a schedule (e.g. daily at 02:00 WAT).
 * Groups all unsettled driver_payable credit entries, creates a settlement
 * cycle, and enqueues one payout job per driver.
 */
export const settlementWorker = new Worker(
  'settlement',
  async (job) => {
    job.log('Starting settlement batch')

    const settlementCycleId = uuid()

    // Find all drivers with unsettled payable credits
    // A credit on driver_payable = money owed to driver
    // A debit on driver_payable = money already paid out
    // Net positive balance = pending payout
    const rows = await db
      .select({
        actorId: ledgerEntries.actorId,
        netKobo: sql<number>`
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_kobo ELSE -amount_kobo END), 0)
        `,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.account, 'driver_payable'))
      .groupBy(ledgerEntries.actorId)

    const payable = rows.filter((r) => r.actorId && Number(r.netKobo) > 0)

    job.log(`Found ${payable.length} drivers with pending payouts`)

    for (const row of payable) {
      if (!row.actorId) continue
      await enqueue.payout({
        driverId: row.actorId,
        settlementCycleId,
      })
    }

    job.log(`Enqueued ${payable.length} payout jobs for cycle ${settlementCycleId}`)
    return { settlementCycleId, payoutCount: payable.length }
  },
  { connection: bullConnection, concurrency: 1 },
)
