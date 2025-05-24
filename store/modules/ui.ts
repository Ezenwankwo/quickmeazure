import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UiState } from '../types'

/**
 * UI store for managing UI state
 * Handles layout, theme, and UI preferences
 */
export const useUiStore = defineStore<UiState>(
  'ui',
  () => {
    // State that conforms to UiState interface
    const sidebarCollapsed = ref(false)
    const theme = ref<'light' | 'dark' | 'system'>('system')
    const isMobileMenuOpen = ref(false)
    const lastViewedPage = ref<string | null>(null)

    // Initialize from localStorage if available
    if (import.meta.client) {
      // Load sidebar state
      const savedSidebarState = localStorage.getItem('sidebarCollapsed')
      if (savedSidebarState !== null) {
        sidebarCollapsed.value = savedSidebarState === 'true'
      }

      // Load theme preference
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        theme.value = savedTheme as 'light' | 'dark' | 'system'
      }

      // Load last viewed page
      const savedLastPage = localStorage.getItem('lastViewedPage')
      if (savedLastPage) {
        lastViewedPage.value = savedLastPage
      }
    }

    // Computed
    const effectiveTheme = computed(() => {
      if (theme.value !== 'system') return theme.value

      // For system theme, check media query
      if (import.meta.client) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }

      // Default to light on server
      return 'light'
    })

    // Actions
    /**
     * Toggle sidebar collapsed state
     */
    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value

      if (import.meta.client) {
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
      }
    }

    /**
     * Set theme preference
     */
    function setTheme(newTheme: 'light' | 'dark' | 'system') {
      theme.value = newTheme

      if (import.meta.client) {
        localStorage.setItem('theme', newTheme)

        // Apply theme to document
        const htmlEl = document.documentElement
        if (effectiveTheme.value === 'dark') {
          htmlEl.classList.add('dark')
        } else {
          htmlEl.classList.remove('dark')
        }
      }
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
      isMobileMenuOpen.value = !isMobileMenuOpen.value
    }

    /**
     * Set last viewed page
     */
    function setLastViewedPage(path: string) {
      lastViewedPage.value = path

      if (import.meta.client) {
        localStorage.setItem('lastViewedPage', path)
      }
    }

    /**
     * Initialize UI state
     * Called on app mount
     */
    function init() {
      // Apply theme to document
      if (import.meta.client) {
        const htmlEl = document.documentElement
        if (effectiveTheme.value === 'dark') {
          htmlEl.classList.add('dark')
        } else {
          htmlEl.classList.remove('dark')
        }

        // Setup system theme change listener
        if (theme.value === 'system') {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (theme.value === 'system') {
              const htmlEl = document.documentElement
              if (e.matches) {
                htmlEl.classList.add('dark')
              } else {
                htmlEl.classList.remove('dark')
              }
            }
          })
        }
      }
    }

    return {
      // State
      sidebarCollapsed,
      theme,
      isMobileMenuOpen,
      lastViewedPage,

      // Computed
      effectiveTheme,

      // Actions
      toggleSidebar,
      setTheme,
      toggleMobileMenu,
      setLastViewedPage,
      init,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : null,
      paths: ['sidebarCollapsed', 'theme', 'lastViewedPage'],
    },
  }
)
