import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useSubscriptionStore } from './subscription'
import { differenceInDays, parseISO } from 'date-fns'

export interface Notification {
  id: string
  type: 'payment' | 'subscription' | 'usage' | 'system'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  createdAt: Date
  read: boolean
  actionUrl?: string
  actionText?: string
  expiresAt?: Date
}

/**
 * Notification store for managing user notifications
 * Handles payment reminders, subscription alerts, and usage warnings
 */
export const useNotificationStore = defineStore('notification', () => {
  // Dependencies
  const authStore = useAuthStore()
  const subscriptionStore = useSubscriptionStore()

  // State
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastChecked = ref<Date | null>(null)

  // Computed properties
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const paymentNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'payment')
  })

  const subscriptionNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'subscription')
  })

  const usageNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'usage')
  })

  // Methods
  /**
   * Fetch notifications from the server
   */
  const fetchNotifications = async () => {
    if (!authStore.isLoggedIn) return

    try {
      loading.value = true
      error.value = null

      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const data = await response.json()
      notifications.value = data.notifications || []
      lastChecked.value = new Date()
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.value.find(n => n.id === notificationId)
      if (!notification) return

      // Optimistically update UI
      notification.read = true

      // Update on server
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('Error marking notification as read:', err)
      // Revert optimistic update on error
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) notification.read = false
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      // Optimistically update UI
      notifications.value.forEach(n => {
        n.read = true
      })

      // Update on server
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      // Revert optimistic update on error
      await fetchNotifications()
    }
  }

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      // Optimistically update UI
      notifications.value = notifications.value.filter(n => n.id !== notificationId)

      // Update on server
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
      // Revert optimistic update on error
      await fetchNotifications()
    }
  }

  /**
   * Check for subscription expiration and generate notifications
   * This should be called periodically to update notifications
   */
  const checkSubscriptionStatus = () => {
    if (!authStore.isLoggedIn || !subscriptionStore.currentSubscription) return

    const subscription = subscriptionStore.currentSubscription
    const plan = subscriptionStore.currentPlan

    if (!subscription || !plan) return

    // Check for subscription expiration
    if (subscription.endDate) {
      const endDate =
        typeof subscription.endDate === 'string'
          ? parseISO(subscription.endDate)
          : subscription.endDate
      const now = new Date()
      const daysUntilExpiration = differenceInDays(endDate, now)

      // If subscription expires within 14 days, create a notification
      if (daysUntilExpiration <= 14 && daysUntilExpiration > 0) {
        let severity: 'info' | 'warning' | 'critical' = 'info'

        // Adjust severity based on how close to expiration
        if (daysUntilExpiration <= 3) {
          severity = 'critical'
        } else if (daysUntilExpiration <= 7) {
          severity = 'warning'
        }

        // Add a notification if one doesn't already exist
        const existingNotification = notifications.value.find(
          n => n.type === 'subscription' && n.title.includes('Subscription Expiring')
        )

        if (!existingNotification) {
          addLocalNotification({
            type: 'subscription',
            severity,
            title: 'Subscription Expiring Soon',
            message: `Your ${plan.name} plan will expire in ${daysUntilExpiration} days. Renew now to avoid service interruption.`,
            actionUrl: '/settings/billing',
            actionText: 'Renew Subscription',
            expiresAt: endDate,
          })
        }
      }
    }

    // Check for trial expiration
    if (subscription.status === 'trial') {
      const trialEndDate = subscription.trialEndDate
        ? typeof subscription.trialEndDate === 'string'
          ? parseISO(subscription.trialEndDate)
          : subscription.trialEndDate
        : null

      if (trialEndDate) {
        const now = new Date()
        const daysUntilTrialEnd = differenceInDays(trialEndDate, now)

        // If trial expires within 7 days, create a notification
        if (daysUntilTrialEnd <= 7 && daysUntilTrialEnd > 0) {
          let severity: 'info' | 'warning' | 'critical' = 'info'

          // Adjust severity based on how close to expiration
          if (daysUntilTrialEnd <= 2) {
            severity = 'critical'
          } else if (daysUntilTrialEnd <= 4) {
            severity = 'warning'
          }

          // Add a notification if one doesn't already exist
          const existingNotification = notifications.value.find(
            n => n.type === 'subscription' && n.title.includes('Trial Ending')
          )

          if (!existingNotification) {
            addLocalNotification({
              type: 'subscription',
              severity,
              title: 'Trial Ending Soon',
              message: `Your trial period will end in ${daysUntilTrialEnd} days. Choose a plan to continue using all features.`,
              actionUrl: '/settings/billing',
              actionText: 'Choose a Plan',
              expiresAt: trialEndDate,
            })
          }
        }
      }
    }
  }

  /**
   * Check for payment due dates and generate reminders
   */
  const checkPaymentReminders = () => {
    if (!authStore.isLoggedIn || !subscriptionStore.currentSubscription) return

    const subscription = subscriptionStore.currentSubscription
    const plan = subscriptionStore.currentPlan

    if (!subscription || !plan || subscription.status !== 'active' || plan.price <= 0) return
    if (!subscription.nextBillingDate) return

    const billingDate =
      typeof subscription.nextBillingDate === 'string'
        ? parseISO(subscription.nextBillingDate)
        : subscription.nextBillingDate
    const now = new Date()
    const daysUntilBilling = differenceInDays(billingDate, now)

    // Remind about upcoming payment
    if (daysUntilBilling <= 7 && daysUntilBilling > 0) {
      let severity: 'info' | 'warning' | 'critical' = 'info'

      // Adjust severity based on how close the payment is
      if (daysUntilBilling <= 2) {
        severity = 'warning'
      }

      // Check if we already have this notification
      const existingNotification = notifications.value.find(
        n => n.type === 'payment' && n.title.includes('Payment Due') && !n.read
      )

      if (!existingNotification) {
        // Add payment reminder
        addLocalNotification({
          type: 'payment',
          severity,
          title: `Payment Due in ${daysUntilBilling} Days`,
          message: `Your ${plan.name} plan will be renewed soon. Please ensure your payment method is up to date.`,
          actionUrl: '/settings/billing',
          actionText: 'Update Payment Method',
          expiresAt: billingDate,
        })
      }
    }
  }

  /**
   * Check usage limits and generate warnings
   */
  const checkUsageLimits = () => {
    if (!authStore.isLoggedIn || !subscriptionStore.currentSubscription) return

    const subscription = subscriptionStore.currentSubscription
    const plan = subscriptionStore.currentPlan

    if (!subscription || !plan || !plan.limits) return
    if (plan.price <= 0) return // Skip free plans

    const limits = plan.limits
    const usageData = subscriptionStore.usageData || {}

    // Check client limit
    if (limits.maxClients && usageData.clientCount) {
      const percentUsed = (usageData.clientCount / limits.maxClients) * 100

      if (percentUsed >= 80) {
        let severity: 'info' | 'warning' | 'critical' = 'info'

        // Adjust severity based on how close to the limit
        if (percentUsed >= 90) {
          severity = 'warning'
        }

        // Check if we already have this notification
        const existingNotification = notifications.value.find(
          n => n.type === 'usage' && n.title.includes('Client Limit') && !n.read
        )

        if (!existingNotification) {
          // Add usage warning
          addLocalNotification({
            type: 'usage',
            severity,
            title: 'Client Limit Approaching',
            message: `You've used ${usageData.clientCount} of ${limits.maxClients} clients (${Math.round(percentUsed)}%). Consider upgrading your plan for more clients.`,
            actionUrl: '/settings/billing',
            actionText: 'Upgrade Plan',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
          })
        }
      }
    }

    // Check measurement limit
    if (limits.maxMeasurements && usageData.measurementCount) {
      const percentUsed = (usageData.measurementCount / limits.maxMeasurements) * 100

      if (percentUsed >= 80) {
        let severity: 'info' | 'warning' | 'critical' = 'info'

        // Adjust severity based on how close to the limit
        if (percentUsed >= 90) {
          severity = 'warning'
        }

        // Check if we already have this notification
        const existingNotification = notifications.value.find(
          n => n.type === 'usage' && n.title.includes('Measurement Limit') && !n.read
        )

        if (!existingNotification) {
          // Add usage warning
          addLocalNotification({
            type: 'usage',
            severity,
            title: 'Measurement Limit Approaching',
            message: `You've used ${usageData.measurementCount} of ${limits.maxMeasurements} measurements (${Math.round(percentUsed)}%). Consider upgrading your plan for more measurements.`,
            actionUrl: '/settings/billing',
            actionText: 'Upgrade Plan',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
          })
        }
      }
    }
  }

  /**
   * Add a notification locally (client-side only)
   */
  const addLocalNotification = (
    notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => {
    const newNotification: Notification = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      read: false,
      ...notificationData,
    }

    notifications.value.unshift(newNotification)
  }

  /**
   * Run all notification checks
   * This should be called on app initialization and periodically
   */
  const runNotificationChecks = () => {
    if (!authStore.isLoggedIn) return

    // Check subscription status
    checkSubscriptionStatus()

    // Check payment reminders
    checkPaymentReminders()

    // Check usage limits
    checkUsageLimits()

    // Update last checked timestamp
    lastChecked.value = new Date()

    // Set up periodic checks (every 6 hours)
    const checkInterval = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
    setTimeout(() => {
      runNotificationChecks()
    }, checkInterval)
  }

  return {
    // State
    notifications,
    loading,
    error,
    lastChecked,

    // Computed
    unreadCount,
    paymentNotifications,
    subscriptionNotifications,
    usageNotifications,

    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkSubscriptionStatus,
    checkPaymentReminders,
    checkUsageLimits,
    addLocalNotification,
    runNotificationChecks,
  }
})
