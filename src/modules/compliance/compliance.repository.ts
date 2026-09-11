import { db } from '../../db/index.js'
import { complianceItems, complianceEvents } from '../../db/schema/compliance.js'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

type ComplianceItem = typeof complianceItems.$inferSelect
type ComplianceEvent = typeof complianceEvents.$inferSelect
type NewComplianceItem = typeof complianceItems.$inferInsert
type NewComplianceEvent = typeof complianceEvents.$inferInsert

export const complianceRepository = {
  // Compliance Items
  async createItem(data: Omit<NewComplianceItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const [item] = await db.insert(complianceItems).values(data).returning()
    return item
  },

  async findItemById(id: string) {
    const [item] = await db.select().from(complianceItems).where(eq(complianceItems.id, id)).limit(1)
    return item
  },

  async listItems({ entityId, entityType, jurisdiction, status, limit = 20, offset = 0 }: {
    entityId?: string
    entityType?: string
    jurisdiction?: string
    status?: string
    limit?: number
    offset?: number
  } = {}) {
    const conditions = []
    if (entityId) conditions.push(eq(complianceItems.entityId, entityId))
    if (entityType) conditions.push(eq(complianceItems.entityType, entityType))
    if (jurisdiction) conditions.push(eq(complianceItems.jurisdiction, jurisdiction))
    if (status) conditions.push(eq(complianceItems.status, status))

    return db
      .select()
      .from(complianceItems)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(complianceItems.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async updateItem(id: string, data: Partial<Omit<NewComplianceItem, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [item] = await db.update(complianceItems).set({ ...data, updatedAt: new Date() }).where(eq(complianceItems.id, id)).returning()
    return item
  },

  async deleteItem(id: string) {
    await db.delete(complianceItems).where(eq(complianceItems.id, id))
  },

  // Compliance Events
  async createEvent(data: NewComplianceEvent) {
    const [event] = await db.insert(complianceEvents).values(data).returning()
    return event
  },

  async listEventsByItem(itemId: string, limit = 20, offset = 0) {
    return db
      .select()
      .from(complianceEvents)
      .where(eq(complianceEvents.complianceItemId, itemId))
      .orderBy(desc(complianceEvents.createdAt))
      .limit(limit)
      .offset(offset)
  },

  // Stats
  async getComplianceStats() {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems)
    const [compliant] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(eq(complianceItems.status, 'compliant'))
    const [pending] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(eq(complianceItems.status, 'pending'))
    const [expiring] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(eq(complianceItems.status, 'expiring_soon'))
    const [expired] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(eq(complianceItems.status, 'expired'))
    const [blocked] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(eq(complianceItems.status, 'blocked'))

    const byItemType = await db
      .select({ itemType: complianceItems.itemType, count: sql<number>`count(*)` })
      .from(complianceItems)
      .groupBy(complianceItems.itemType)

    return { total: total?.count ?? 0, compliant: compliant?.count ?? 0, pending: pending?.count ?? 0, expiring: expiring?.count ?? 0, expired: expired?.count ?? 0, blocked: blocked?.count ?? 0, byItemType }
  },

  // Check expiring items
  async checkExpiringItems() {
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    return db
      .select()
      .from(complianceItems)
      .where(and(eq(complianceItems.status, 'compliant'), lte(complianceItems.expiresAt, soon)))
  },
}