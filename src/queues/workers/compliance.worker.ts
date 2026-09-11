import { Worker } from 'bullmq'
import { bullConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { driverDocuments, drivers } from '../../db/schema/index.js'
import { and, isNotNull, lte, gte, isNull } from 'drizzle-orm'
import { enqueue } from '../enqueue.js'

const EXPIRY_WARNING_DAYS = 14

export const complianceWorker = new Worker(
  'compliance',
  async (job) => {
    job.log('Running compliance expiry check')

    const now = new Date()
    const warningThreshold = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000)

    // Find documents expiring within the warning window
    const expiringDocs = await db.query.driverDocuments.findMany({
      where: and(
        isNotNull(driverDocuments.expiresAt),
        lte(driverDocuments.expiresAt, warningThreshold),
        gte(driverDocuments.expiresAt, now),
        isNull(driverDocuments.rejectedAt),
      ),
    })

    job.log(`Found ${expiringDocs.length} documents expiring within ${EXPIRY_WARNING_DAYS} days`)

    for (const doc of expiringDocs) {
      const driver = await db.query.drivers.findFirst({
        where: (drivers, { eq }) => eq(drivers.id, doc.driverId),
      })
      if (!driver) continue

      const daysUntilExpiry = Math.ceil(
        (doc.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      await enqueue.notification({
        userId: driver.userId,
        templateId: 'document_expiring',
        channel: 'sms',
        variables: {
          documentType: doc.type,
          daysUntilExpiry: String(daysUntilExpiry),
        },
      })
    }

    // Find already-expired documents and flag drivers
    const expiredDocs = await db.query.driverDocuments.findMany({
      where: and(
        isNotNull(driverDocuments.expiresAt),
        lte(driverDocuments.expiresAt, now),
        isNull(driverDocuments.rejectedAt),
      ),
    })

    job.log(`Found ${expiredDocs.length} expired documents`)

    return {
      expiringCount: expiringDocs.length,
      expiredCount: expiredDocs.length,
    }
  },
  { connection: bullConnection, concurrency: 1 },
)
