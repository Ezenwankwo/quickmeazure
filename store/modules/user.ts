// Types
import type { User } from '~/types/auth'
import type { UserPreferences } from '~/types/user'
import type { SubscriptionPlan } from '~/types/subscription'

// Constants
import { API_ENDPOINTS } from '~/constants/api'

/**
 * User store for managing user profile data, subscription status, and preferences
 * Separated from auth store to maintain clear separation of concerns
 */
export const useUserStore = defineStore('user', () => {
  // Get runtime config
  const _config = useRuntimeConfig()

  // State
  const profile = ref<User | null>(null)
  const preferences = ref<UserPreferences>({
    theme: 'system',
    measurementUnit: 'imperial',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      browser: true,
      mobile: true,
    },
    dashboardLayout: 'default',
  })
  const subscriptionDetails = ref<{
    plan: SubscriptionPlan | null
    status: 'active' | 'inactive' | 'trial' | 'expired'
    expiryDate: string | null
    features: string[]
    clientLimit: number
  }>({
    plan: null,
    status: 'inactive',
    expiryDate: null,
    features: [],
    clientLimit: 0,
  })

  // Computed properties
  const isSubscriptionActive = computed(() => {
    return (
      subscriptionDetails.value.status === 'active' || subscriptionDetails.value.status === 'trial'
    )
  })

  const displayName = computed(() => {
    if (!profile.value) return ''
    return profile.value.name || profile.value.email.split('@')[0]
  })

  const initials = computed(() => {
    if (!profile.value?.name) return ''
    return profile.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  })

  // Actions
  /**
   * Initialize the user store
   * @param userData User data from auth store or API
   */
  function init(userData: User | null) {
    profile.value = userData

    // Load subscription details from user data
    if (userData) {
      updateSubscriptionDetails(userData)
    }

    // Load user preferences from localStorage
    if (import.meta.client) {
      try {
        const savedPreferences = localStorage.getItem('user-preferences')
        if (savedPreferences) {
          preferences.value = {
            ...preferences.value,
            ...JSON.parse(savedPreferences),
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences from localStorage', error)
      }
    }
  }

  /**
   * Update user profile data
   * @param userData Updated user data
   */
  function updateProfile(userData: Partial<User>) {
    if (!profile.value) return

    profile.value = {
      ...profile.value,
      ...userData,
    }

    // Update subscription details if relevant fields changed
    if (userData.subscriptionPlan || userData.subscriptionExpiry) {
      updateSubscriptionDetails(profile.value)
    }
  }

  /**
   * Update subscription details based on user data
   */
  function updateSubscriptionDetails(userData: User) {
    const plan = userData.subscriptionPlan || 'free'
    const expiryDate = userData.subscriptionExpiry

    // Determine subscription status
    let status: 'active' | 'inactive' | 'trial' | 'expired' = 'inactive'

    if (plan === 'free') {
      status = 'inactive'
    } else if (plan === 'trial') {
      status = expiryDate && new Date(expiryDate) > new Date() ? 'trial' : 'expired'
    } else {
      status = expiryDate && new Date(expiryDate) > new Date() ? 'active' : 'expired'
    }

    // Set features and limits based on plan
    const features = getFeaturesByPlan(plan)
    const clientLimit = getClientLimitByPlan(plan)

    subscriptionDetails.value = {
      plan,
      status,
      expiryDate,
      features,
      clientLimit,
    }
  }

  /**
   * Update user preferences
   * @param newPreferences Updated preferences
   */
  function updatePreferences(newPreferences: Partial<UserPreferences>) {
    preferences.value = {
      ...preferences.value,
      ...newPreferences,
    }

    // Save to localStorage
    if (import.meta.client) {
      try {
        localStorage.setItem('user-preferences', JSON.stringify(preferences.value))
      } catch (error) {
        console.error('Failed to save user preferences to localStorage', error)
      }
    }
  }

  /**
   * Reset user store state
   */
  function reset() {
    profile.value = null
    subscriptionDetails.value = {
      plan: null,
      status: 'inactive',
      expiryDate: null,
      features: [],
      clientLimit: 0,
    }

    // Don't reset preferences as they should persist across sessions
  }

  /**
   * Check if user has access to a specific feature
   * @param featureName Name of the feature to check
   */
  function hasFeatureAccess(featureName: string): boolean {
    return subscriptionDetails.value.features.includes(featureName)
  }

  /**
   * Get remaining client slots
   * @param currentClientCount Current number of clients
   */
  function getRemainingClientSlots(currentClientCount: number): number {
    return Math.max(0, subscriptionDetails.value.clientLimit - currentClientCount)
  }

  /**
   * Fetch user profile data from the API using useAsyncData
   * @returns Promise with the result of the operation
   */
  async function fetchProfile() {
    try {
      console.log('User store: Fetching profile data...')

      // Use useAsyncData for the profile fetch
      const { data, error: fetchError } = await useAsyncData(
        'user-profile',
        () =>
          $fetch(API_ENDPOINTS.USERS.ME, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            server: true,
          }),
        {
          server: true,
          lazy: true,
          default: () => null,
        }
      )

      // Check for errors
      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch profile data')
      }

      const response = data.value

      if (response) {
        // Update the store with the fetched profile data
        updateProfile(response)
        console.log('User store: Profile data fetched and updated')
      }

      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('Profile fetch failed:', error)

      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch profile data',
      }
    }
  }

  /**
   * Update user profile data via API
   * @param profileData Profile data to update
   * @returns Promise with the result of the operation
   */
  async function updateProfileData(profileData: Partial<User>) {
    try {
      console.log('User store: Updating profile data...')

      // Call the profile API endpoint
      const response = await $fetch(API_ENDPOINTS.USERS.PROFILE, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response) {
        // Update the store with the updated profile data
        updateProfile(response)
        console.log('User store: Profile data updated successfully')
      }

      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('Profile update failed:', error)

      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update profile data',
      }
    }
  }

  /**
   * Upload user avatar
   * @param file Avatar image file to upload
   * @returns Promise with the result of the operation
   */
  async function uploadAvatar(file: File) {
    try {
      console.log('User store: Uploading avatar...')

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('avatar', file)

      // Call the avatar upload API endpoint
      const response = await $fetch(API_ENDPOINTS.USERS.UPDATE_AVATAR, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header here, let the browser set it with the correct boundary
      })

      if (response?.avatarUrl) {
        // Update only the avatar in the profile
        updateProfile({ avatar: response.avatarUrl })
        console.log('User store: Avatar updated successfully')
      }

      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('Avatar upload failed:', error)

      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to upload avatar',
      }
    }
  }

  /**
   * Change user password
   * @param currentPassword Current password for verification
   * @param newPassword New password to set
   */
  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      console.log('User store: Attempting password change...')

      // Call the change-password API endpoint
      const response = await $fetch(API_ENDPOINTS.USERS.UPDATE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('User store: Password change response:', response)

      return {
        success: true,
        message: 'Password updated successfully',
      }
    } catch (error: any) {
      console.error('Password change failed:', error)

      return {
        success: false,
        error:
          error.data?.message ||
          error.message ||
          'An unexpected error occurred during password change',
      }
    }
  }

  // Return public store interface
  return {
    // State
    profile,
    preferences,
    subscriptionDetails,

    // Computed
    isSubscriptionActive,
    displayName,
    initials,

    // Actions
    init,
    updateProfile,
    updateSubscriptionDetails,
    getFeaturesByPlan,
    getClientLimitByPlan,
    updatePreferences,
    reset,
    hasFeatureAccess,
    getRemainingClientSlots,
    fetchProfile,
    updateProfileData,
    uploadAvatar,
    changePassword,
  }
})
