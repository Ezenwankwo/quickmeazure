import { useDrizzle } from '../utils/drizzle'

// Export the database connection
export const db = useDrizzle()

// Re-export schema for convenience
export * from './schema'
