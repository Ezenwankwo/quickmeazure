import type { Config } from 'drizzle-kit';

export default {
  schema: './server/database/schema.ts',
  out: './migrations',
  driver: 'turso',
  dbCredentials: {
    url: 'file:./quickmeazure.db'
  },
} satisfies Config; 