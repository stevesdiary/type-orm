import type { FastifyInstance } from 'fastify'
import { optionalAuthenticate } from '../../lib/rbac.js'
import { maps } from '../../providers/maps.js'
import { geocodeQuerySchema, routeRequestSchema, type GeocodeQuery, type RouteRequestBody } from './maps.schema.js'

/**
 * Thin, rate-limited proxy over the maps provider so mobile clients never
 * hold a Mapbox token. Quotes need distance/duration, so riders call
 * /route before /pricing/quote.
 */
export async function mapsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: GeocodeQuery }>('/geocode', { preHandler: optionalAuthenticate }, async (req) => {
    const { q } = geocodeQuerySchema.parse(req.query)
    const places = await maps.geocode(q)
    return { places }
  })

  app.post<{ Body: RouteRequestBody }>('/route', { preHandler: optionalAuthenticate }, async (req) => {
    const body = routeRequestSchema.parse(req.body)
    const route = await maps.getRoute(
      { lat: body.pickupLat, lng: body.pickupLng },
      { lat: body.destinationLat, lng: body.destinationLng },
    )
    return route
  })
}
