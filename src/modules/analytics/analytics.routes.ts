import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../lib/rbac.js'

export async function analyticsRoutes(app: FastifyInstance) {
  app.get('/marketplace', { preHandler: [authenticate, authorize('admin')] }, async () => {
    return {
      totalTrips: 0,
      activeDrivers: 0,
      activeRiders: 0,
      revenueKobo: 0,
      message: 'Marketplace analytics - Phase 11',
    }
  })

  app.get('/driver/:driverId', { preHandler: [authenticate] }, async () => {
    return { earnings: [], rating: 5, message: 'Driver analytics - Phase 11' }
  })

  app.get('/rider/:riderId', { preHandler: [authenticate] }, async () => {
    return { trips: [], spending: 0, message: 'Rider analytics - Phase 11' }
  })
}