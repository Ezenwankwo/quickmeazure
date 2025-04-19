import fs from 'fs'
import path from 'path'
import { useDrizzle, sql } from './drizzle'

// Fix the path resolution to use the process.cwd() approach
const projectRoot = process.cwd()
const MIGRATIONS_DIR = path.resolve(projectRoot, 'server/database/migrations')

/**
 * Apply database migrations programmatically
 */
export async function applyMigrations() {
  try {
    console.log('🔄 Checking for database migrations...')
    console.log(`Using migrations directory: ${MIGRATIONS_DIR}`)
    
    // Get database connection
    const db = useDrizzle()
    
    // Test connection before proceeding
    try {
      await db.execute(sql`SELECT 1`)
      console.log('✅ Database connection test successful')
    } catch (connError) {
      console.error('❌ Database connection test failed:', connError)
      throw new Error('Cannot connect to database to apply migrations. Please check your database configuration.')
    }
    
    // Create migrations table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "_migrations" (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `)
      console.log('✅ Successfully created or verified migrations table')
    } catch (error) {
      console.error('❌ Error creating migrations table:', error)
      throw error
    }
    
    // Read all migration files
    let migrationFiles: string[] = []
    try {
      migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort()
    } catch (err: any) {
      console.error('❌ Error reading migrations directory:', err)
      throw new Error(`Cannot read migrations directory: ${err.message}`)
    }
    
    if (migrationFiles.length === 0) {
      console.log('ℹ️ No migration files found.')
      return true
    }
    
    console.log(`📊 Found ${migrationFiles.length} migration files to process`)
    
    // Get applied migrations
    const { rows: appliedMigrations } = await db.execute(sql`
      SELECT name FROM "_migrations" ORDER BY name
    `)
    
    const appliedMigrationNames = appliedMigrations.map((row: any) => row.name)
    console.log(`ℹ️ ${appliedMigrationNames.length} migrations have already been applied`)
    
    // Apply new migrations
    let success = true
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '')
      
      if (appliedMigrationNames.includes(migrationName)) {
        console.log(`✓ Migration ${migrationName} already applied, skipping`)
        continue
      }
      
      try {
        console.log(`⏳ Applying migration: ${migrationName}`)
        
        // Read the migration file
        const migrationPath = path.join(MIGRATIONS_DIR, file)
        const migrationSql = fs.readFileSync(migrationPath, 'utf8')
        
        // Split SQL statements by statement-breakpoint
        const statements = migrationSql.split('--> statement-breakpoint')
        
        // Start a transaction
        await db.execute(sql`BEGIN;`)
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim()
          if (statement) {
            try {
              await db.execute(sql.raw(statement))
              console.log(`✓ Executed statement ${i + 1}/${statements.length} successfully`)
            } catch (stmtError) {
              console.error(`❌ Error executing statement ${i + 1}/${statements.length}:`, stmtError)
              console.error(`Statement: ${statement.substring(0, 150)}...`)
              throw stmtError
            }
          }
        }
        
        // Record the migration
        await db.execute(sql`
          INSERT INTO "_migrations" (name) VALUES (${migrationName});
        `)
        
        // Commit the transaction
        await db.execute(sql`COMMIT;`)
        
        console.log(`✅ Successfully applied migration: ${migrationName}`)
      } catch (error) {
        console.error(`❌ Error applying migration ${migrationName}:`, error)
        
        // Try to rollback
        try {
          await db.execute(sql`ROLLBACK;`)
          console.log('✓ Transaction rolled back successfully')
        } catch (rollbackError) {
          console.error('❌ Error rolling back transaction:', rollbackError)
        }
        
        success = false
        break
      }
    }
    
    if (success) {
      console.log('🎉 All migrations completed successfully!')
    } else {
      console.error('❌ Migration process failed.')
    }
    
    return success
  } catch (error) {
    console.error('❌ Error in applyMigrations:', error)
    return false
  }
} 