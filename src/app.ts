import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import { errorHandler } from './lib/errors.js'
import { redis } from './lib/idempotency.js'
import { env } from './config/env.js'

// Module routes
import { identityRoutes } from './modules/identity/identity.routes.js'
import { riderRoutes } from './modules/riders/riders.routes.js'
import { driverRoutes } from './modules/drivers/drivers.routes.js'
import { vehicleRoutes } from './modules/vehicles/vehicles.routes.js'
import { rideRoutes } from './modules/rides/rides.routes.js'
import { pricingRoutes } from './modules/pricing/pricing.routes.js'
import { paymentRoutes } from './modules/payments/payments.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { internalRoutes } from './modules/internal/internal.routes.js'
import { tripWsRoutes } from './websocket/trip.ws.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
  })

  // Plugins
  await app.register(cors, { origin: true })
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
  })
  await app.register(websocket)

  // Error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Routes
  await app.register(identityRoutes, { prefix: '/auth' })
  await app.register(riderRoutes, { prefix: '/riders' })
  await app.register(driverRoutes, { prefix: '/drivers' })
  await app.register(vehicleRoutes, { prefix: '/vehicles' })
  await app.register(rideRoutes, { prefix: '/rides' })
  await app.register(pricingRoutes, { prefix: '/pricing' })
  await app.register(paymentRoutes, { prefix: '/payments' })
  await app.register(adminRoutes, { prefix: '/admin' })
  await app.register(internalRoutes, { prefix: '/internal' })
  await app.register(tripWsRoutes)

  return app
}
