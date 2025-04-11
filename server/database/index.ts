import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { runMigrations, seedInitialData } from './migrations';

// Create a database client
export const createDbClient = () => {
  const client = createClient({
    // For local development, we'll use a local SQLite file
    url: 'file:./quickmeazure.db',
  });

  return drizzle(client, { schema });
};

// Initialize database with migrations
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    await runMigrations();
    await seedInitialData();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Export a singleton instance for use throughout the app
export const db = createDbClient();

// Run initialization when in server context
if (process.server) {
  initializeDatabase();
}