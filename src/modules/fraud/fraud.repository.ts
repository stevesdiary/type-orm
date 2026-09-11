import { db } from '../../db/index.js'
import { fraudSignals, fraudReviews, type FraudSignal, type FraudReview } from '../../db/schema/fraud.js'
import { eq, and, desc, sql } from 'drizzle-orm'

export const fraudRepository = {
  // Fraud Signals
  async createSignal(data: Omit<FraudSignal, 'id' | 'createdAt'>) {
    const [signal] = await db.insert(fraudSignals).values(data).returning()
    return signal
  },

  async findSignalById(id: string) {
    const [signal] = await db.select().from(fraudSignals).where(eq(fraudSignals.id, id)).limit(1)
    return signal
  },

  async listSignals({ entityId, entityType, signalType, requiresReview, limit = 20, offset = 0 }: {
    entityId?: string
    entityType?: string
    signalType?: string
    requiresReview?: boolean
    limit?: number
    offset?: number
  } = {}) {
    const conditions = []
    if (entityId) conditions.push(eq(fraudSignals.entityId, entityId))
    if (entityType) conditions.push(eq(fraudSignals.entityType, entityType))
    if (signalType) conditions.push(eq(fraudSignals.signalType, signalType))
    if (requiresReview !== undefined) conditions.push(eq(fraudSignals.requiresReview, requiresReview))

    return db
      .select()
      .from(fraudSignals)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(fraudSignals.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async updateSignal(id: string, data: Partial<Omit<FraudSignal, 'id' | 'createdAt'>>) {
    const [signal] = await db.update(fraudSignals).set(data).where(eq(fraudSignals.id, id)).returning()
    return signal
  },

  // Fraud Reviews
  async createReview(data: Omit<FraudReview, 'id' | 'createdAt' | 'updatedAt'>) {
    const [review] = await db.insert(fraudReviews).values(data).returning()
    return review
  },

  async findReviewBySignalId(signalId: string) {
    const [review] = await db.select().from(fraudReviews).where(eq(fraudReviews.fraudSignalId, signalId)).limit(1)
    return review
  },

  async listReviews({ status, limit = 20, offset = 0 }: { status?: string; limit?: number; offset?: number } = {}) {
    const conditions = status ? [eq(fraudReviews.status, status)] : []
    return db
      .select()
      .from(fraudReviews)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(fraudReviews.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async updateReview(id: string, data: Partial<Omit<FraudReview, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [review] = await db
      .update(fraudReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(fraudReviews.id, id))
      .returning()
    return review
  },

  // Stats
  async getSignalStats() {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(fraudSignals)
    const [pendingReview] = await db
      .select({ count: sql<number>`count(*)` })
      .from(fraudSignals)
      .where(eq(fraudSignals.requiresReview, true))

    const byType = await db
      .select({ signalType: fraudSignals.signalType, count: sql<number>`count(*)` })
      .from(fraudSignals)
      .groupBy(fraudSignals.signalType)

    return { total: total?.count ?? 0, pendingReview: pendingReview?.count ?? 0, byType }
  },
}