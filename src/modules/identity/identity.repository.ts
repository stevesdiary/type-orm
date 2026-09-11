import { db } from '../../db/index.js'
import { users } from '../../db/schema/index.js'
import { eq } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'

export const identityRepository = {
  async findUserByPhone(phone: string) {
    return db.query.users.findFirst({ where: eq(users.phone, phone) })
  },

  /** Returns the user for this phone, creating a rider account on first login. */
  async upsertRiderByPhone(phone: string): Promise<{ id: string; name: string | null; isNew: boolean }> {
    const existing = await this.findUserByPhone(phone)
    if (existing) return { id: existing.id, name: existing.name, isNew: false }
    const id = uuid()
    await db.insert(users).values({ id, phone, role: 'rider' })
    return { id, name: null, isNew: true }
  },
}
