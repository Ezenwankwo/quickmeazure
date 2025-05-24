import { beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Initialize Pinia globally before any tests run
beforeAll(() => {
  // Create a global pinia instance
  const pinia = createPinia()
  setActivePinia(pinia)
})

// Reset Pinia for each test
beforeEach(() => {
  // Create a fresh pinia instance and set it as active for each test
  const pinia = createPinia()
  setActivePinia(pinia)
})

// Global teardown for all tests
afterEach(() => {
  vi.resetAllMocks()
})

// Mock Nuxt-specific globals
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    },
    navigateTo: vi.fn(),
  })),
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
  navigateTo: vi.fn(),
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: '/dashboard' })),
}))

// Mock global fetch and $fetch
global.fetch = vi.fn()
global.$fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Set up global mocks
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
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
})
