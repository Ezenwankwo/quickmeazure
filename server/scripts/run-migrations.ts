import * as dotenv from 'dotenv'
import { applyMigrations } from '../utils/migration-helper'

// Load environment variables
dotenv.config()

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration process...')

    const success = await applyMigrations()

    if (success) {
      console.log('✅ Migrations completed successfully')
      process.exit(0)
    } else {
      console.error('❌ Migrations failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Unexpected error running migrations:', error)
    process.exit(1)
  }
}

// Run the migrations
runMigrations().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
