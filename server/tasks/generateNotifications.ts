import { defineTask } from 'nitro-cron'
import {
  generatePaymentReminders,
  generateSubscriptionExpirationAlerts,
  generateUsageLimitWarnings,
  cleanupExpiredNotifications,
} from '../services/notificationService'

/**
 * Scheduled task to generate notifications for users
 * Runs daily at 1:00 AM
 */
export default defineTask({
  meta: {
    name: 'Generate User Notifications',
    description:
      'Generates payment reminders, subscription expiration alerts, and usage limit warnings',
  },
  schedule: '0 1 * * *', // Run daily at 1:00 AM
  handler: async () => {
    console.log('Starting notification generation task...')
    const startTime = Date.now()

    try {
      // Clean up expired notifications first
      await cleanupExpiredNotifications()
      console.log('Expired notifications cleaned up')

      // Generate payment reminders
      const paymentReminders = await generatePaymentReminders()
      console.log(`Generated ${paymentReminders.count} payment reminders`)

      // Generate subscription expiration alerts
      const expirationAlerts = await generateSubscriptionExpirationAlerts()
      console.log(`Generated ${expirationAlerts.count} subscription expiration alerts`)

      // Generate usage limit warnings
      const usageWarnings = await generateUsageLimitWarnings()
      console.log(`Generated ${usageWarnings.count} usage limit warnings`)

      const totalTime = Date.now() - startTime
      console.log(`Notification generation task completed in ${totalTime}ms`)

      return {
        success: true,
        paymentReminders: paymentReminders.count,
        expirationAlerts: expirationAlerts.count,
        usageWarnings: usageWarnings.count,
        totalTime,
      }
    } catch (error) {
      console.error('Error in notification generation task:', error)

      return {
        success: false,
        error: error.message,
      }
    }
  },
})
