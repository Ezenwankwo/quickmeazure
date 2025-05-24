/**
 * Storage utility functions
 *
 * Provides standardized methods for interacting with localStorage
 * with proper error handling and type safety.
 */

/**
 * Get a value from localStorage with proper error handling
 * @param key The localStorage key
 * @returns The parsed value or null if not found or error
 */
export function getFromStorage<T>(key: string): T | null {
  if (!import.meta.client) return null

  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return null
  }
}

/**
 * Set a value in localStorage with proper error handling
 * @param key The localStorage key
 * @param value The value to store
 * @returns True if successful, false otherwise
 */
export function setToStorage<T>(key: string, value: T): boolean {
  if (!import.meta.client) return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error)
    return false
  }
}

/**
 * Remove a value from localStorage with proper error handling
 * @param key The localStorage key
 * @returns True if successful, false otherwise
 */
export function removeFromStorage(key: string): boolean {
  if (!import.meta.client) return false

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
    return false
  }
}

/**
 * Clear all localStorage values with proper error handling
 * @returns True if successful, false otherwise
 */
export function clearStorage(): boolean {
  if (!import.meta.client) return false

  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

/**
 * Storage keys used throughout the application
 * Centralizing these prevents typos and inconsistencies
 */
export const STORAGE_KEYS = {
  AUTH: 'auth',
  SUBSCRIPTION: 'subscription',
  USER_PREFERENCES: 'user-preferences',
  MEASUREMENT_SETTINGS: 'measurement-settings',
  RECENT_CLIENTS: 'recent-clients',
}
