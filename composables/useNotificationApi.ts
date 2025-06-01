import { API_ENDPOINTS } from '~/constants/api'
import { useAuthStore } from '~/store'
import type { Notification } from '~/types/notification'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface NotificationsResponse extends ApiResponse {
  notifications?: Notification[]
}

export function useNotificationApi() {
  const toast = useToast()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  // Check if running on client side
  const isClient = typeof window !== 'undefined'

  if (!isClient) {
    // Return mock functions for server-side rendering
    return {
      getNotifications: (): Promise<NotificationsResponse> =>
        Promise.resolve({ success: true, notifications: [] }),
      markAsRead: (): Promise<ApiResponse> => Promise.resolve({ success: true }),
      markAllAsRead: (): Promise<ApiResponse> => Promise.resolve({ success: true }),
      deleteNotification: (): Promise<ApiResponse> => Promise.resolve({ success: true }),
    }
  }

  /**
   * Helper function to handle API errors
   */
  const handleError = (error: any, defaultMessage: string): ApiResponse => {
    console.error(defaultMessage, error)

    if (isClient) {
      toast.add({
        title: 'Error',
        description: error.data?.message || defaultMessage,
        color: 'red',
      })
    }

    return {
      success: false,
      error: error.data?.message || defaultMessage,
    }
  }

  /**
   * Fetch notifications from the server
   */
  const getNotifications = async (): Promise<NotificationsResponse> => {
    try {
      const { data, error } = await useAsyncData<Notification[]>(
        'user-notifications',
        () =>
          $api(API_ENDPOINTS.NOTIFICATIONS.BASE, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          }),
        {
          server: true,
          lazy: true,
          default: () => [],
        }
      )

      if (error.value) {
        throw new Error(error.value?.message || 'Failed to fetch notifications')
      }

      return { success: true, notifications: data.value || [] }
    } catch (error) {
      return handleError(error, 'Failed to fetch notifications')
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   */
  const markAsRead = async (notificationId: string): Promise<ApiResponse> => {
    try {
      await $fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })
      return { success: true }
    } catch (error) {
      return handleError(error, `Failed to mark notification as read`)
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async (): Promise<ApiResponse> => {
    try {
      await $fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })
      return { success: true }
    } catch (error) {
      return handleError(error, 'Failed to mark all notifications as read')
    }
  }

  /**
   * Delete a notification
   * @param notificationId Notification ID to delete
   */
  /**
   * Delete a notification
   * @param notificationId - ID of the notification to delete
   */
  const deleteNotification = async (notificationId: string): Promise<ApiResponse> => {
    try {
      await $fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })
      return { success: true }
    } catch (error) {
      return handleError(error, `Failed to delete notification`)
    }
  }

  return {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}

export default useNotificationApi
