import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../lib/rbac.js'

export async function fraudRoutes(app: FastifyInstance) {
  app.post('/report', { preHandler: [authenticate] }, async () => {
    return { message: 'Report fraud - Phase 11' }
  })

  // Admin
  app.get('/signals', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return { signals: [], message: 'Fraud signals - Phase 11' }
  })

  app.get('/reviews', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return { reviews: [], message: 'Fraud reviews - Phase 11' }
  })
}