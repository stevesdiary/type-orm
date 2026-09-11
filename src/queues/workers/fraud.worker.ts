import { Worker } from 'bullmq'
import { bullConnection } from '../connection.js'
import { db } from '../../db/index.js'
import { fraudSignals, fraudReviews } from '../../db/schema/index.js'
import { eq, and, count } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'

// Map incoming signal strings to schema enum values
const SIGNAL_MAP: Record<string, typeof fraudSignals.$inferInsert['signalType']> = {
  gps_spoofing_suspected: 'gps_spoof',
  rapid_cancellations: 'abnormal_cancellation',
  promo_abuse: 'promo_abuse',
  multiple_accounts_same_device: 'duplicate_account',
  payment_failure_repeated: 'payment_risk',
  trip_route_deviation: 'circular_trip',
  driver_account_sharing: 'device_sharing',
  unusual_trip_pattern: 'impossible_travel',
}

// Confidence thresholds that require immediate review
const HIGH_CONFIDENCE_SIGNALS = new Set(['gps_spoof', 'duplicate_account', 'device_sharing'])

export const fraudWorker = new Worker(
  'fraud',
  async (job) => {
    const { tripId, signal, metadata } = job.data as {
      tripId: string
      signal: string
      metadata: Record<string, unknown>
    }

    job.log(`Processing fraud signal "${signal}" for trip ${tripId}`)

    const signalType = SIGNAL_MAP[signal]
    if (!signalType) {
      job.log(`Unknown signal type "${signal}" — skipping`)
      return { skipped: true, reason: 'unknown_signal' }
    }

    const actorId = metadata.actorId as string | undefined
    const confidence = typeof metadata.confidence === 'number' ? metadata.confidence : 0.5
    const requiresReview = HIGH_CONFIDENCE_SIGNALS.has(signalType) || confidence >= 0.8

    const signalId = uuid()
    await db.insert(fraudSignals).values({
      id: signalId,
      entityId: actorId ?? tripId,
      entityType: actorId ? (metadata.actorType as string ?? 'user') : 'trip',
      signalType,
      confidence,
      metadata: JSON.stringify(metadata),
      tripId,
      requiresReview,
    })

    if (requiresReview) {
      await db.insert(fraudReviews).values({
        id: uuid(),
        fraudSignalId: signalId,
        status: 'pending',
        note: `Auto-flagged: ${signal} (confidence: ${confidence})`,
      })
      job.log(`Signal flagged for review: ${signalType} confidence=${confidence}`)
    }

    return { recorded: true, signalType, requiresReview }
  },
  { connection: bullConnection, concurrency: 5 },
)
