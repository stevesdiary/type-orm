import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../lib/rbac.js'

export async function complianceRoutes(app: FastifyInstance) {
  app.get('/items', { preHandler: [authenticate] }, async () => {
    return { items: [], message: 'Compliance items - Phase 11' }
  })

  app.get('/driver/:driverId', { preHandler: [authenticate] }, async () => {
    return { items: [], status: 'pending', message: 'Driver compliance - Phase 11' }
  })

  // Admin
  app.post('/items', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return { message: 'Create compliance item - Phase 11' }
  })

  app.put('/items/:itemId', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return { message: 'Update compliance item - Phase 11' }
  })
}