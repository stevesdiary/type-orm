import { ledgerRepository } from '../payments/ledger.repository.js'
import { errors } from '../../lib/errors.js'
import { db } from '../../db/index.js'
import { ledgerEntries } from '../../db/schema/index.js'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

export const ledgerService = {
  async getEntriesForReference(referenceId: string, referenceType: string) {
    return ledgerRepository.getEntriesForReference(referenceId, referenceType)
  },

  async getEntriesByCorrelationId(correlationId: string) {
    return ledgerRepository.getEntriesByCorrelationId(correlationId)
  },

  async getAccountBalance(account: string) {
    const result = await db
      .select({
        credits: sql<number>`COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_kobo ELSE 0 END), 0)`,
        debits: sql<number>`COALESCE(SUM(CASE WHEN type = 'debit' THEN amount_kobo ELSE 0 END), 0)`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.account, account as any))

    const row = result[0]
    if (!row) return { account, balanceKobo: 0, creditsKobo: 0, debitsKobo: 0 }

    return {
      account,
      creditsKobo: Number(row.credits),
      debitsKobo: Number(row.debits),
      balanceKobo: Number(row.credits) - Number(row.debits),
    }
  },

  async getRecentEntries(limit = 50, offset = 0, account?: string, from?: Date, to?: Date) {
    const conditions: any[] = []
    if (account) conditions.push(eq(ledgerEntries.account, account as any))
    if (from) conditions.push(gte(ledgerEntries.createdAt, from))
    if (to) conditions.push(lte(ledgerEntries.createdAt, to))

    return db.query.ledgerEntries.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(ledgerEntries.createdAt)],
      limit,
      offset,
    })
  },

  async getWalletBalance(ownerId: string, ownerType: 'rider' | 'driver' | 'corporate' | 'fleet_owner') {
    return ledgerRepository.getWalletBalance(ownerId, ownerType)
  },
}
