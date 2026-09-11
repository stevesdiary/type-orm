import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../lib/rbac.js'

export async function promotionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, async () => {
    return { promotions: [], message: 'Available promotions - Phase 11' }
  })

  app.post('/redeem', { preHandler: [authenticate] }, async () => {
    return { message: 'Redeem promotion - Phase 11' }
  })

  app.get('/referrals', { preHandler: [authenticate] }, async () => {
    return { referrals: [], message: 'Referral tracking - Phase 11' }
  })

  // Admin
  app.post('/', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return { message: 'Create promotion - Phase 11' }
  })
}