import { drizzle } from 'drizzle-orm/node-postgres'
import pkg from 'pg';
const { Pool } = pkg;
import { eq, and, or, sql, lte, inArray, desc, asc, gt, gte, lt, ne, isNull, isNotNull, like, notLike, between } from 'drizzle-orm'

import * as schema from '../database/schema'

// Export tables and query helpers
export const tables = schema
export { eq, and, or, sql, lte, inArray, desc, asc, gt, gte, lt, ne, isNull, isNotNull, like, notLike, between }

// Cache the database connection
let _db: ReturnType<typeof createDrizzleClient> | null = null

function createDrizzleClient() {
  // Use the DATABASE_URL directly from environment variables
  const connectionString = process.env.DATABASE_URL || '';
  
  if (!connectionString) {
    console.error('DATABASE_URL is not provided in environment variables');
    throw new Error('DATABASE_URL is required');
  }
  
  console.log('Creating database connection with provided DATABASE_URL');
  
  // Create a PostgreSQL connection pool
  const pool = new Pool({ 
    connectionString,
    ssl: process.env.NODE_ENV === 'production' // Only use SSL in production
  });
  
  // Set up error handling for the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  // Create and return the Drizzle client
  return drizzle(pool, { schema })
}

/**
 * Server composable for Drizzle ORM database access
 */
export function useDrizzle() {
  // Create the client if it doesn't exist yet
  if (!_db) {
    _db = createDrizzleClient()
  }
  
  return _db
}

// Export types for convenience
export type User = typeof schema.users.$inferSelect
export type Business = typeof schema.businesses.$inferSelect
export type Client = typeof schema.clients.$inferSelect
export type Order = typeof schema.orders.$inferSelect
export type Style = typeof schema.styles.$inferSelect
export type Measurement = typeof schema.measurements.$inferSelect 