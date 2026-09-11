import { Worker } from 'bullmq'
import { bullConnection } from '../connection.js'
import { sms } from '../../providers/sms.js'
import { db } from '../../db/index.js'
import { devices, users } from '../../db/schema/index.js'
import { eq } from 'drizzle-orm'
import type { NotificationJobData } from '../enqueue.js'

// Template registry — in production, load from DB or config
const TEMPLATES: Record<string, (vars: Record<string, string>) => string> = {
  driver_offer: (v) => `New ride request! Open NaijaMove to accept. Trip ID: ${v.tripId}`,
  trip_matched: (v) => `Your driver is on the way. ETA: ${v.eta} mins.`,
  driver_arrived: () => `Your driver has arrived. Please proceed to the pickup point.`,
  trip_started: () => `Your trip has started. Have a safe journey!`,
  trip_completed: (v) => `Trip completed. You were charged ₦${v.amountNaira}. Rate your driver.`,
  trip_cancelled: (v) => `Your trip was cancelled. Reason: ${v.reason}`,
  otp: (v) => `Your NaijaMove verification code is ${v.code}. Valid for 5 minutes.`,
  payout_initiated: (v) => `Your payout of ₦${v.amountNaira} has been initiated.`,
  wallet_credited: (v) => `Your wallet has been credited with ₦${v.amountNaira}.`,
}

export const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { userId, templateId, channel, variables } = job.data as NotificationJobData

    const template = TEMPLATES[templateId]
    if (!template) {
      job.log(`Unknown template: ${templateId}`)
      return { skipped: true, reason: 'unknown_template' }
    }

    const message = template(variables)

    if (channel === 'sms') {
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
      if (!user?.phone) {
        job.log(`No phone for user ${userId}`)
        return { skipped: true, reason: 'no_phone' }
      }
      await sms.sendMessage(user.phone, message)
      job.log(`SMS sent to ${user.phone}`)
      return { sent: true, channel: 'sms' }
    }

    if (channel === 'push') {
      const device = await db.query.devices.findFirst({ where: eq(devices.userId, userId) })
      if (!device?.pushToken) {
        job.log(`No push token for user ${userId} — falling back to SMS`)
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
        if (user?.phone) await sms.sendMessage(user.phone, message)
        return { sent: true, channel: 'sms_fallback' }
      }
      // In production: call FCM/APNs here
      job.log(`Push notification queued for token ${device.pushToken}: ${message}`)
      return { sent: true, channel: 'push' }
    }

    if (channel === 'whatsapp') {
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
      if (!user?.phone) return { skipped: true, reason: 'no_phone' }
      // In production: call WhatsApp Business API here
      job.log(`WhatsApp message queued for ${user.phone}: ${message}`)
      return { sent: true, channel: 'whatsapp' }
    }

    return { skipped: true, reason: 'unknown_channel' }
  },
  { connection: bullConnection, concurrency: 10 },
)
