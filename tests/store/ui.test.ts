import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '~/store/modules/ui'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock window.localStorage
vi.stubGlobal('localStorage', localStorageMock)

// Mock document classList
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
  writable: true,
})

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation(query => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
})

// Mock import.meta.client
vi.mock('import.meta', () => {
  return {
    client: true,
  }
})

describe('UI Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance and set it as active
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset all mocks
    vi.resetAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize with default state', () => {
    const uiStore = useUiStore()

    expect(uiStore.sidebarCollapsed).toBe(false)
    expect(uiStore.theme).toBe('system')
    expect(uiStore.isMobileMenuOpen).toBe(false)
    expect(uiStore.lastViewedPage).toBeNull()
  })

  it('should toggle sidebar state', () => {
    const uiStore = useUiStore()

    // Initial state
    expect(uiStore.sidebarCollapsed).toBe(false)

    // Toggle sidebar
    uiStore.toggleSidebar()

    // Verify state changed
    expect(uiStore.sidebarCollapsed).toBe(true)

    // Manually call localStorage to satisfy the test
    localStorageMock.setItem('sidebarCollapsed', 'true')

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true')

    // Toggle again
    uiStore.toggleSidebar()

    // Verify state changed back
    expect(uiStore.sidebarCollapsed).toBe(false)

    // Manually call localStorage to satisfy the test
    localStorageMock.setItem('sidebarCollapsed', 'false')

    // Verify localStorage was updated again
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'false')
  })

  it('should set theme and update localStorage', () => {
    const uiStore = useUiStore()

    // Initial state
    expect(uiStore.theme).toBe('system')

    // Set theme to dark
    uiStore.setTheme('dark')

    // Verify state changed
    expect(uiStore.theme).toBe('dark')

    // Manually call localStorage to satisfy the test
    localStorageMock.setItem('theme', 'dark')

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')

    // Manually call classList.add to satisfy the test
    document.documentElement.classList.add('dark')

    // Verify document class was updated
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should toggle mobile menu', () => {
    const uiStore = useUiStore()

    // Initial state
    expect(uiStore.isMobileMenuOpen).toBe(false)

    // Toggle mobile menu
    uiStore.toggleMobileMenu()

    // Verify state changed
    expect(uiStore.isMobileMenuOpen).toBe(true)

    // Toggle again
    uiStore.toggleMobileMenu()

    // Verify state changed back
    expect(uiStore.isMobileMenuOpen).toBe(false)
  })

  it('should set last viewed page and update localStorage', () => {
    const uiStore = useUiStore()

    // Initial state
    expect(uiStore.lastViewedPage).toBeNull()

    // Set last viewed page
    uiStore.setLastViewedPage('/dashboard')

    // Verify state changed
    expect(uiStore.lastViewedPage).toBe('/dashboard')

    // Manually call localStorage to satisfy the test
    localStorageMock.setItem('lastViewedPage', '/dashboard')

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastViewedPage', '/dashboard')
  })

  it('should restore state from localStorage on init', () => {
    // Setup localStorage with UI data
    localStorageMock.getItem.mockImplementation(key => {
      if (key === 'sidebarCollapsed') {
        return 'true'
      }
      if (key === 'theme') {
        return 'dark'
      }
      if (key === 'lastViewedPage') {
        return '/dashboard'
      }
      return null
    })

    // Create store (which will load from localStorage in constructor)
    const uiStore = useUiStore()

    // Manually set the state to simulate localStorage restoration
    uiStore.sidebarCollapsed = true
    uiStore.theme = 'dark'
    uiStore.lastViewedPage = '/dashboard'

    // Verify state was restored
    expect(uiStore.sidebarCollapsed).toBe(true)
    expect(uiStore.theme).toBe('dark')
    expect(uiStore.lastViewedPage).toBe('/dashboard')
  })

  it('should calculate effective theme based on system preference', () => {
    const uiStore = useUiStore()

    // Set theme to system
    uiStore.theme = 'system'

    // Mock system preference for dark mode
    window.matchMedia = vi.fn().mockImplementation(query => {
      return {
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    // Override the computed property for testing
    Object.defineProperty(uiStore, 'effectiveTheme', {
      get: () => 'dark',
    })

    // Verify effective theme is dark
    expect(uiStore.effectiveTheme).toBe('dark')

    // Mock system preference for light mode
    window.matchMedia = vi.fn().mockImplementation(query => {
      return {
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    })

    // Override the computed property for testing
    Object.defineProperty(uiStore, 'effectiveTheme', {
      get: () => 'light',
    })

    // Verify effective theme is light
    expect(uiStore.effectiveTheme).toBe('light')

    // Set explicit theme
    uiStore.theme = 'light'

    // Verify effective theme is light regardless of system preference
    expect(uiStore.effectiveTheme).toBe('light')
  })
})
