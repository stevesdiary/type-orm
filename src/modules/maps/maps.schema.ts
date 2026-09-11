import { z } from 'zod'

export const geocodeQuerySchema = z.object({
  q: z.string().min(2).max(200),
})

export const routeRequestSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
})

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>
export type RouteRequestBody = z.infer<typeof routeRequestSchema>
