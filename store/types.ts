/**
 * Common types used across stores
 */

// Subscription plan types
export type SubscriptionPlan = 'free' | 'trial' | 'basic' | 'premium'

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  measurementUnit: 'imperial' | 'metric'
  dateFormat: string
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  dashboardLayout: string
}

// User type
export interface User {
  id: string
  name: string
  email: string
  subscriptionPlan?: SubscriptionPlan
  subscriptionExpiry?: string | null
  hasCompletedSetup?: boolean
  preferences?: Partial<UserPreferences>
}

// API Response type
export interface ApiResponse<T = any> {
  data: T | null
  success: boolean
  error?: string
  statusCode?: number
}

// Pagination type
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// API Response with pagination
export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  pagination: Pagination
}

// Auth state
export interface AuthState {
  user: User | null
  token: string | null
  sessionExpiry: number | null
  isRefreshing: boolean
}

// API state
export interface ApiState {
  loading: boolean
  error: string | null
  pendingRequests: number
}

// UI state
export interface UiState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  isMobileMenuOpen: boolean
  lastViewedPage: string | null
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

// Registration data
export interface RegistrationData {
  name: string
  email: string
  password: string
  plan?: string
}

// Auth headers
export interface AuthHeaders {
  Authorization?: string
}

// API request options
export interface ApiRequestOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  method?: string
  skipErrorHandling?: boolean
  [key: string]: any
}
