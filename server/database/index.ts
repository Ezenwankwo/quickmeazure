import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Create a database client
export const createDbClient = () => {
  const client = createClient({
    // For local development, we'll use a local SQLite file
    url: 'file:./quickmeazure.db',
  });

  return drizzle(client, { schema });
};

// Export a singleton instance for use throughout the app
export const db = createDbClient();