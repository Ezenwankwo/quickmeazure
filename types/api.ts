/**
 * API related types and interfaces
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  data: T | null
  success: boolean
  error?: string
  statusCode?: number
  message?: string
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    current_page: number
    from: number
    last_page: number
    path: string
    per_page: number
    to: number
    total: number
  }
}

/**
 * Standard error response
 */
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
  code?: string
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'text'
  skipAuth?: boolean
  skipErrorHandling?: boolean
  [key: string]: any
}

/**
 * Authentication headers
 */
export interface AuthHeaders {
  Authorization?: string
  'X-Refresh-Token'?: string
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  fieldName?: string
  fileName?: string
  mimeType?: string
  metadata?: Record<string, any>
  onProgress?: (progress: number) => void
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  authRequired?: boolean
  roles?: string[]
}
