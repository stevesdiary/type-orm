import { db } from '../../db/index.js'
import { rides, drivers, riders, driverSubscriptions, driverPlans, payments, deliveryJobs, fraudSignals, complianceItems } from '../../db/schema/index.js'
import { eq, and, desc, gte, lte, sql, count, sum, avg } from 'drizzle-orm'

export const analyticsRepository = {
  // Marketplace analytics
  async getMarketplaceStats({ startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = []
    if (startDate) conditions.push(gte(rides.createdAt, startDate))
    if (endDate) conditions.push(lte(rides.createdAt, endDate))

    const [totalTrips] = await db.select({ count: sql<number>`count(*)` }).from(rides).where(conditions.length ? and(...conditions) : undefined)
    const [activeDrivers] = await db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.status, 'active'))
    const [activeRiders] = await db.select({ count: sql<number>`count(*)` }).from(riders).where(eq(riders.status, 'active'))
    const [revenue] = await db.select({ total: sql<number>`coalesce(sum(${payments.amountKobo}), 0)` }).from(payments).where(and(eq(payments.status, 'completed'), ...conditions))

    return {
      totalTrips: totalTrips?.count ?? 0,
      activeDrivers: activeDrivers?.count ?? 0,
      activeRiders: activeRiders?.count ?? 0,
      revenueKobo: revenue?.total ?? 0,
    }
  },

  async getTripsByPeriod({ startDate, endDate, interval = 'day' }: { startDate?: Date; endDate?: Date; interval?: 'hour' | 'day' | 'week' | 'month' } = {}) {
    const conditions = []
    if (startDate) conditions.push(gte(rides.createdAt, startDate))
    if (endDate) conditions.push(lte(rides.createdAt, endDate))

    let groupBy: string
    if (interval === 'hour') groupBy = sql`date_trunc('hour', ${rides.createdAt})`.toString()
    else if (interval === 'day') groupBy = sql`date_trunc('day', ${rides.createdAt})`.toString()
    else if (interval === 'week') groupBy = sql`date_trunc('week', ${rides.createdAt})`.toString()
    else groupBy = sql`date_trunc('month', ${rides.createdAt})`.toString()

    return db
      .select({
        period: sql<Date>`date_trunc(${interval}, ${rides.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(rides)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(sql`date_trunc(${interval}, ${rides.createdAt})`)
      .orderBy(sql`date_trunc(${interval}, ${rides.createdAt})`)
  },

  async getRevenueByPeriod({ startDate, endDate, interval = 'day' }: { startDate?: Date; endDate?: Date; interval?: 'day' | 'week' | 'month' } = {}) {
    const conditions = [eq(payments.status, 'completed')]
    if (startDate) conditions.push(gte(payments.createdAt, startDate))
    if (endDate) conditions.push(lte(payments.createdAt, endDate))

    return db
      .select({
        period: sql<Date>`date_trunc(${interval}, ${payments.createdAt})`,
        revenue: sql<number>`sum(${payments.amountKobo})`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(sql`date_trunc(${interval}, ${payments.createdAt})`)
      .orderBy(sql`date_trunc(${interval}, ${payments.createdAt})`)
  },

  // Driver analytics
  async getDriverAnalytics(driverId: string, { startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = [eq(rides.driverId, driverId)]
    if (startDate) conditions.push(gte(rides.createdAt, startDate))
    if (endDate) conditions.push(lte(rides.createdAt, endDate))

    const [trips] = await db.select({ count: sql<number>`count(*)` }).from(rides).where(and(...conditions))
    const [earnings] = await db.select({ total: sql<number>`coalesce(sum(${payments.amountKobo}), 0)` })
      .from(payments)
      .where(and(eq(payments.driverId, driverId), eq(payments.status, 'completed'), ...conditions))
    const [rating] = await db.select({ avg: sql<number>`avg(${drivers.rating})` }).from(drivers).where(eq(drivers.id, driverId))
    const [completed] = await db.select({ count: sql<number>`count(*)` }).from(rides).where(and(eq(rides.driverId, driverId), eq(rides.status, 'completed'), ...conditions))
    const [cancelled] = await db.select({ count: sql<number>`count(*)` }).from(rides).where(and(eq(rides.driverId, driverId), eq(rides.status, 'cancelled'), ...conditions))

    return {
      totalTrips: trips?.count ?? 0,
      completedTrips: completed?.count ?? 0,
      cancelledTrips: cancelled?.count ?? 0,
      earningsKobo: earnings?.total ?? 0,
      rating: rating?.avg ?? 5,
    }
  },

  async getDriverEarningsHistory(driverId: string, { startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = [eq(payments.driverId, driverId), eq(payments.status, 'completed')]
    if (startDate) conditions.push(gte(payments.createdAt, startDate))
    if (endDate) conditions.push(lte(payments.createdAt, endDate))

    return db
      .select({
        period: sql<Date>`date_trunc('day', ${payments.createdAt})`,
        earnings: sql<number>`sum(${payments.amountKobo})`,
        trips: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${payments.createdAt})`)
      .orderBy(sql`date_trunc('day', ${payments.createdAt})`)
  },

  // Rider analytics
  async getRiderAnalytics(riderId: string, { startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = [eq(rides.riderId, riderId)]
    if (startDate) conditions.push(gte(rides.createdAt, startDate))
    if (endDate) conditions.push(lte(rides.createdAt, endDate))

    const [trips] = await db.select({ count: sql<number>`count(*)` }).from(rides).where(and(...conditions))
    const [spending] = await db.select({ total: sql<number>`coalesce(sum(${payments.amountKobo}), 0)` })
      .from(payments)
      .where(and(eq(payments.riderId, riderId), eq(payments.status, 'completed'), ...conditions))
    const [avgFare] = await db.select({ avg: sql<number>`avg(${rides.fareKobo})` }).from(rides).where(and(...conditions))

    return {
      totalTrips: trips?.count ?? 0,
      spendingKobo: spending?.total ?? 0,
      avgFareKobo: avgFare?.avg ?? 0,
    }
  },

  // Logistics analytics
  async getLogisticsStats({ startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = []
    if (startDate) conditions.push(gte(deliveryJobs.createdAt, startDate))
    if (endDate) conditions.push(lte(deliveryJobs.createdAt, endDate))

    const [totalDeliveries] = await db.select({ count: sql<number>`count(*)` }).from(deliveryJobs).where(conditions.length ? and(...conditions) : undefined)
    const [delivered] = await db.select({ count: sql<number>`count(*)` }).from(deliveryJobs).where(and(eq(deliveryJobs.status, 'delivered'), ...conditions))
    const [revenue] = await db.select({ total: sql<number>`coalesce(sum(${deliveryJobs.priceKobo}), 0)` }).from(deliveryJobs).where(conditions.length ? and(...conditions) : undefined)

    return {
      totalDeliveries: totalDeliveries?.count ?? 0,
      delivered: delivered?.count ?? 0,
      revenueKobo: revenue?.total ?? 0,
    }
  },

  // Fraud analytics
  async getFraudStats({ startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = []
    if (startDate) conditions.push(gte(fraudSignals.createdAt, startDate))
    if (endDate) conditions.push(lte(fraudSignals.createdAt, endDate))

    const [totalSignals] = await db.select({ count: sql<number>`count(*)` }).from(fraudSignals).where(conditions.length ? and(...conditions) : undefined)
    const [pendingReview] = await db.select({ count: sql<number>`count(*)` }).from(fraudSignals).where(and(eq(fraudSignals.requiresReview, true), ...conditions))
    const byType = await db
      .select({ signalType: fraudSignals.signalType, count: sql<number>`count(*)` })
      .from(fraudSignals)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(fraudSignals.signalType)

    return { totalSignals: totalSignals?.count ?? 0, pendingReview: pendingReview?.count ?? 0, byType }
  },

  // Compliance analytics
  async getComplianceStats({ startDate, endDate }: { startDate?: Date; endDate?: Date } = {}) {
    const conditions = []
    if (startDate) conditions.push(gte(complianceItems.createdAt, startDate))
    if (endDate) conditions.push(lte(complianceItems.createdAt, endDate))

    const [total] = await db.select({ count: sql<number>`count(*)` }).from(complianceItems).where(conditions.length ? and(...conditions) : undefined)
    const byStatus = await db
      .select({ status: complianceItems.status, count: sql<number>`count(*)` })
      .from(complianceItems)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(complianceItems.status)

    return { total: total?.count ?? 0, byStatus }
  },

  // Subscription analytics
  async getSubscriptionStats() {
    const [active] = await db.select({ count: sql<number>`count(*)` }).from(driverSubscriptions).where(eq(driverSubscriptions.status, 'active'))
    const byPlan = await db
      .select({ planId: driverSubscriptions.planId, count: sql<number>`count(*)` })
      .from(driverSubscriptions)
      .where(eq(driverSubscriptions.status, 'active'))
      .groupBy(driverSubscriptions.planId)

    return { activeSubscriptions: active?.count ?? 0, byPlan }
  },
}