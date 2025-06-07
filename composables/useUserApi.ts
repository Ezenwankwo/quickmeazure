import type { User } from '~/types/auth'
import { useAuthStore } from '~/store/modules/auth'
import type { UserPreferences } from '~/types/user' // Used in the return type of the composable

// Avatar upload response interface
interface AvatarUploadResponse {
  success: boolean
  avatarUrl: string
  message: string
}

/**
 * Composable for handling user-related API calls
 */
export function useUserApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const toast = useToast()

  /**
   * Fetch user profile data from the API
   */
  async function fetchProfile() {
    try {
      const { data, error } = await useFetch<User>('/api/user/profile', {
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      })

      if (error.value) {
        throw new Error(error.value.message || 'Failed to fetch profile')
      }

      return { data: data.value, error: null }
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error)
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to fetch profile',
        color: 'error',
      })
      return { data: null, error: error.message || 'Failed to fetch profile' }
    }
  }

  /**
   * Update user profile data
   * @param profileData Profile data to update
   */
  async function updateProfile(profileData: Partial<User>) {
    try {
      const { data, error } = await useFetch<User>('/api/user/profile', {
        method: 'PATCH',
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (error.value) {
        throw new Error(error.value.message || 'Failed to update profile')
      }

      toast.add({
        title: 'Success',
        description: 'Profile updated successfully',
        color: 'success',
      })

      return { data: data.value, error: null }
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        color: 'error',
      })
      return { data: null, error: error.message || 'Failed to update profile' }
    }
  }

  /**
   * Update user preferences
   * @param preferences User preferences to update
   */
  async function updateUserPreferences(preferences: Partial<UserPreferences>) {
    try {
      const { data, error } = await $fetch('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      })

      if (error) {
        throw new Error(error.message || 'Failed to update preferences')
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Failed to update preferences:', error)
      return { data: null, error: error.message || 'Failed to update preferences' }
    }
  }

  /**
   * Upload user avatar
   * @param file Avatar image file to upload
   */
  async function uploadAvatar(file: File) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const { data, error } = await useFetch<AvatarUploadResponse>('/api/users/avatar', {
        method: 'POST',
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: formData,
      })

      if (error.value) {
        throw new Error(error.value.message || 'Failed to upload avatar')
      }

      toast.add({
        title: 'Success',
        description: 'Avatar updated successfully',
        color: 'success',
      })

      return { data: data.value, error: null }
    } catch (error: any) {
      console.error('Failed to upload avatar:', error)
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to upload avatar',
        color: 'error',
      })
      return { data: null, error: error.message || 'Failed to upload avatar' }
    }
  }

  /**
   * Change user password
   * @param currentPassword Current password for verification
   * @param newPassword New password to set
   */
  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      const { error } = await useFetch('/api/user/password', {
        method: 'PATCH',
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (error.value) {
        throw new Error(error.value.message || 'Failed to change password')
      }

      toast.add({
        title: 'Success',
        description: 'Password changed successfully',
        color: 'success',
      })

      return { error: null }
    } catch (error: any) {
      console.error('Failed to change password:', error)
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to change password',
        color: 'error',
      })
      return { error: error.message || 'Failed to change password' }
    }
  }

  return {
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}

export default useUserApi
