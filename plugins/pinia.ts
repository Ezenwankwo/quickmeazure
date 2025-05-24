import { defineNuxtPlugin } from '#app'
import { createPinia } from 'pinia'
import { useAuthStore } from '~/store/modules/auth'

/**
 * Pinia plugin for state management
 * Sets up the Pinia store and handles hydration
 */
export default defineNuxtPlugin(nuxtApp => {
  const pinia = createPinia()
  nuxtApp.vueApp.use(pinia)

  // If we're on the client, initialize stores that need
  // immediate setup after hydration
  if (import.meta.client) {
    // Initialize auth store to restore session
    const authStore = useAuthStore()
    authStore.init()
  }

  return {
    provide: {
      pinia,
    },
  }
})
