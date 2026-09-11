import { db } from '../../db/index.js'
import { promotions, promoRedemptions, referrals } from '../../db/schema/promotions.js'
import { eq, and, desc, gte, lte, sql, or } from 'drizzle-orm'

type Promotion = typeof promotions.$inferSelect
type PromoRedemption = typeof promoRedemptions.$inferSelect
type Referral = typeof referrals.$inferSelect
type NewPromotion = typeof promotions.$inferInsert
type NewPromoRedemption = typeof promoRedemptions.$inferInsert
type NewReferral = typeof referrals.$inferInsert

export const promotionsRepository = {
  // Promotions
  async createPromotion(data: NewPromotion) {
    const [promo] = await db.insert(promotions).values(data).returning()
    return promo
  },

  async findPromotionById(id: string) {
    const [promo] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1)
    return promo
  },

  async findPromotionByCode(code: string) {
    const [promo] = await db.select().from(promotions).where(eq(promotions.code, code)).limit(1)
    return promo
  },

  async listPromotions({ activeOnly = true, target, limit = 20, offset = 0 }: { activeOnly?: boolean; target?: string; limit?: number; offset?: number } = {}) {
    const conditions = []
    if (activeOnly) {
      conditions.push(eq(promotions.isActive, true))
      conditions.push(lte(promotions.startsAt, new Date()))
      conditions.push(or(sql`${promotions.endsAt} IS NULL`, gte(promotions.endsAt, new Date())))
    }
    if (target) {
      conditions.push(eq(promotions.target, target))
    }
    return db
      .select()
      .from(promotions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(promotions.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async updatePromotion(id: string, data: Partial<Omit<NewPromotion, 'id' | 'createdAt'>>) {
    const [promo] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning()
    return promo
  },

  async deletePromotion(id: string) {
    await db.delete(promotions).where(eq(promotions.id, id))
  },

  // Redemptions
  async createRedemption(data: NewPromoRedemption) {
    const [redemption] = await db.insert(promoRedemptions).values(data).returning()
    // Increment redemption count on promotion
    await db
      .update(promotions)
      .set({ redemptionCount: sql`${promotions.redemptionCount} + 1`, spentKobo: sql`${promotions.spentKobo} + ${data.discountKobo}` })
      .where(eq(promotions.id, data.promotionId))
    return redemption
  },

  async findRedemptionById(id: string) {
    const [redemption] = await db.select().from(promoRedemptions).where(eq(promoRedemptions.id, id)).limit(1)
    return redemption
  },

  async listRedemptionsByUser(userId: string, limit = 20, offset = 0) {
    return db
      .select()
      .from(promoRedemptions)
      .where(eq(promoRedemptions.userId, userId))
      .orderBy(desc(promoRedemptions.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async countUserRedemptions(promotionId: string, userId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(promoRedemptions)
      .where(and(eq(promoRedemptions.promotionId, promotionId), eq(promoRedemptions.userId, userId)))
    return result?.count ?? 0
  },

  // Referrals
  async createReferral(data: NewReferral) {
    const [referral] = await db.insert(referrals).values(data).returning()
    return referral
  },

  async findReferralByCode(code: string) {
    const [referral] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1)
    return referral
  },

  async findReferralByReferredId(referredId: string) {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referredId, referredId)).limit(1)
    return referral
  },

  async listReferralsByReferrer(referrerId: string, limit = 20, offset = 0) {
    return db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async updateReferralReward(referralId: string, rewardKobo: number) {
    const [referral] = await db
      .update(referrals)
      .set({ rewardKobo, rewardedAt: new Date() })
      .where(eq(referrals.id, referralId))
      .returning()
    return referral
  },
}