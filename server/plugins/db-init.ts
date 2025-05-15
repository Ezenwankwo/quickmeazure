import { applyMigrations } from '../utils/migration-helper'

export default defineNitroPlugin(async () => {
  console.log('🔄 Initializing database and applying migrations...')
  
  try {
    const success = await applyMigrations()
    
    if (success) {
      console.log('✅ Database initialization complete - migrations applied successfully')
    } else {
      console.error('❌ Database initialization failed - migrations could not be applied')
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error)
  }
})
