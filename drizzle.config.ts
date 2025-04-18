import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Get the database URL directly from environment variables
const getDatabaseUrl = () => {
  // Use the direct DATABASE_URL if provided
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fallback to local PostgreSQL if no URL is provided
  console.warn('DATABASE_URL not found, falling back to local PostgreSQL connection');
  return 'postgresql://postgres:postgres@localhost:5432/postgres';
};

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
}) 