import { applyMigrations } from '../utils/migration-helper'

export default defineNitroPlugin(async () => {
  console.log('🚀 Starting server plugin: Apply database migrations')

  // Skip migrations if SKIP_MIGRATIONS environment variable is set to true
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('Skipping migrations as SKIP_MIGRATIONS is set to true')
    return
  }

  // Apply migrations
  try {
    await applyMigrations()
  } catch (error) {
    console.error('Failed to apply migrations:', error)
  }
}) 