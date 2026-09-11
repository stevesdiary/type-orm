import { redis } from '../../lib/idempotency.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js'
import { errors } from '../../lib/errors.js'
import { sms } from '../../providers/sms.js'
import { v4 as uuid } from 'uuid'
import { identityRepository } from './identity.repository.js'

const OTP_TTL = 300 // 5 minutes
const OTP_RATE_LIMIT = 3 // max requests per window
const OTP_RATE_WINDOW = 600 // 10 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function requestOtp(phone: string): Promise<void> {
  const rateLimitKey = `otp:rate:${phone}`
  const count = await redis.incr(rateLimitKey)
  if (count === 1) await redis.expire(rateLimitKey, OTP_RATE_WINDOW)
  if (count > OTP_RATE_LIMIT) throw errors.unprocessable('Too many OTP requests. Try again later.')

  const code = generateOtp()
  await redis.set(`otp:${phone}`, code, { ex: OTP_TTL })
  await sms.sendOtp(phone, code)
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string; isNewUser: boolean; name: string | null }> {
  const stored = await redis.get<string>(`otp:${phone}`)
  if (!stored || String(stored) !== code) throw errors.unauthorized('Invalid or expired OTP')

  await redis.del(`otp:${phone}`)

  const user = await identityRepository.upsertRiderByPhone(phone)
  const sessionId = uuid()

  const payload = { sub: user.id, role: 'rider' as const, sessionId }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await redis.set(`refresh:${sessionId}`, refreshToken, { ex: 60 * 60 * 24 * 30 })

  return { accessToken, refreshToken, userId: user.id, isNewUser: user.isNew, name: user.name }
}

export async function refreshTokens(
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(token)

  const stored = await redis.get<string>(`refresh:${payload.sessionId}`)
  if (!stored || stored !== token) throw errors.unauthorized('Refresh token revoked or invalid')

  // Rotate — invalidate old, issue new pair
  await redis.del(`refresh:${payload.sessionId}`)

  const newSessionId = uuid()
  const newPayload = { sub: payload.sub, role: payload.role, sessionId: newSessionId }
  const accessToken = signAccessToken(newPayload)
  const refreshToken = signRefreshToken(newPayload)

  await redis.set(`refresh:${newSessionId}`, refreshToken, { ex: 60 * 60 * 24 * 30 })

  return { accessToken, refreshToken }
}

export async function logout(sessionId: string): Promise<void> {
  await redis.del(`refresh:${sessionId}`)
}
