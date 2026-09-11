import { db } from '../../db/index.js'
import { driverPlans, driverSubscriptions } from '../../db/schema/subscriptions.js'
import { eq, and, desc, sql } from 'drizzle-orm'

type DriverPlan = typeof driverPlans.$inferSelect
type DriverSubscription = typeof driverSubscriptions.$inferSelect
type NewDriverPlan = typeof driverPlans.$inferInsert
type NewDriverSubscription = typeof driverSubscriptions.$inferInsert

export const subscriptionsRepository = {
  // Plans
  async createPlan(data: Omit<NewDriverPlan, 'id' | 'createdAt'>) {
    const [plan] = await db.insert(driverPlans).values(data).returning()
    return plan
  },

  async findPlanById(id: string) {
    const [plan] = await db.select().from(driverPlans).where(eq(driverPlans.id, id)).limit(1)
    return plan
  },

  async listPlans(activeOnly = true) {
    const conditions = activeOnly ? [eq(driverPlans.isActive, true)] : []
    return db.select().from(driverPlans).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(driverPlans.createdAt))
  },

  async updatePlan(id: string, data: Partial<Omit<NewDriverPlan, 'id' | 'createdAt'>>) {
    const [plan] = await db.update(driverPlans).set({ ...data, updatedAt: new Date() }).where(eq(driverPlans.id, id)).returning()
    return plan
  },

  async deletePlan(id: string) {
    await db.delete(driverPlans).where(eq(driverPlans.id, id))
  },

  // Subscriptions
  async createSubscription(data: Omit<NewDriverSubscription, 'id' | 'createdAt' | 'updatedAt'>) {
    const [sub] = await db.insert(driverSubscriptions).values(data).returning()
    return sub
  },

  async findSubscriptionById(id: string) {
    const [sub] = await db.select().from(driverSubscriptions).where(eq(driverSubscriptions.id, id)).limit(1)
    return sub
  },

  async findActiveSubscriptionByDriver(driverId: string) {
    const [sub] = await db
      .select()
      .from(driverSubscriptions)
      .where(
        and(
          eq(driverSubscriptions.driverId, driverId),
          eq(driverSubscriptions.status, 'active'),
        )
      )
      .limit(1)
    return sub
  },

  async listDriverSubscriptions(driverId: string) {
    return db
      .select()
      .from(driverSubscriptions)
      .where(eq(driverSubscriptions.driverId, driverId))
      .orderBy(desc(driverSubscriptions.createdAt))
  },

  async updateSubscription(id: string, data: Partial<Omit<NewDriverSubscription, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [sub] = await db
      .update(driverSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(driverSubscriptions.id, id))
      .returning()
    return sub
  },

  async cancelSubscription(id: string) {
    const [sub] = await db
      .update(driverSubscriptions)
      .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(driverSubscriptions.id, id))
      .returning()
    return sub
  },

  async expireSubscriptions() {
    const now = new Date()
    await db
      .update(driverSubscriptions)
      .set({ status: 'expired', updatedAt: now })
      .where(and(eq(driverSubscriptions.status, 'active'), sql`${driverSubscriptions.currentPeriodEnd} < ${now}`))
  },
}