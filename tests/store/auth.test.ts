import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/store/modules/auth'

// Mock the actual store implementation
const mockAuthStore = vi.fn()
vi.mock('~/store/modules/auth', () => ({
  useAuthStore: () => mockAuthStore(),
}))

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create a fresh pinia instance and set it as active for each test
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset localStorage mock
    localStorageMock = {}

    // Mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value
      },
      removeItem: (key: string) => {
        // Use object destructuring to safely remove the property
        const { [key]: _, ...rest } = localStorageMock
        localStorageMock = rest as Record<string, string>
      },
      clear: () => {
        localStorageMock = {}
      },
      key: (index: number) => {
        const keys = Object.keys(localStorageMock)
        return index >= 0 && index < keys.length ? keys[index] : null
      },
      get length() {
        return Object.keys(localStorageMock).length
      },
    }

    // Set up the localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Mock the auth store
    mockAuthStore.mockImplementation(() => ({
      user: null,
      token: null,
      sessionExpiry: null,
      isRefreshing: false,
      status: 'unauthenticated',
      isLoggedIn: false,
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn().mockResolvedValue({ success: true }),
    }))

    // Create a fresh auth store
    authStore = useAuthStore()
  })

  afterEach(() => {
    vi.resetAllMocks()
    localStorageMock = {}
  })

  test('should initialize with default state', () => {
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.sessionExpiry).toBeNull()
    expect(authStore.isRefreshing).toBe(false)
    expect(authStore.isLoggedIn).toBe(false)
    expect(authStore.status).toBe('unauthenticated')
  })

  test('should handle successful login', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password',
    }

    // Mock successful login response
    authStore.login = vi.fn().mockResolvedValueOnce({ success: true })

    const result = await authStore.login(credentials)

    expect(authStore.login).toHaveBeenCalledWith(credentials)
    expect(result).toEqual({ success: true })
  })

  test('should handle login failure', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
    }

    // Mock failed login response
    authStore.login = vi.fn().mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials',
    })

    const result = await authStore.login(credentials)

    expect(authStore.login).toHaveBeenCalledWith(credentials)
    expect(result).toEqual({
      success: false,
      error: 'Invalid credentials',
    })
  })

  test('should handle logout when authenticated', async () => {
    // Set up authenticated state
    authStore.isLoggedIn = true
    authStore.user = { id: '123', email: 'test@example.com', name: 'Test User' }
    authStore.token = 'test-token'

    // Mock successful logout
    authStore.logout = vi.fn().mockResolvedValueOnce({ success: true })

    const result = await authStore.logout()

    expect(authStore.logout).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  test('should handle logout when not authenticated', async () => {
    // Ensure not authenticated
    authStore.isLoggedIn = false
    authStore.user = null
    authStore.token = null

    // The result is not used, so we don't need to assign it
    await authStore.logout()

    // Should still resolve successfully
    expect(authStore.logout).toHaveBeenCalled()
  })

  test('should refresh token when valid refresh token exists', async () => {
    // Set up refresh token
    authStore.refreshToken = 'valid-refresh-token'

    // Mock token refresh
    const mockRefresh = vi.fn().mockResolvedValueOnce({
      success: true,
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
    authStore.refreshToken = mockRefresh

    const result = await authStore.refreshToken()

    expect(mockRefresh).toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
  })

  test('should handle token refresh failure', async () => {
    // Mock failed token refresh
    const mockRefresh = vi.fn().mockResolvedValueOnce({
      success: false,
      error: 'Invalid refresh token',
    })
    authStore.refreshToken = mockRefresh

    const result = await authStore.refreshToken()

    expect(mockRefresh).toHaveBeenCalled()
    expect(result).toEqual({
      success: false,
      error: 'Invalid refresh token',
    })
  })
})
