// Script to run the SQL migration file directly
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Client } from '@libsql/client'
import { createClient } from '@libsql/client'

// Get current file directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration(): Promise<boolean> {
  try {
    // Create database client
    const client: Client = createClient({
      url: 'file:./quickmeazure.db',
    })

    console.log('Running migration...')

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'migrations',
      '0003_update_client_measurement_relationship.sql'
    )
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8')

    // Split and execute SQL statements
    const statements: string[] = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`Executing migration with ${statements.length} SQL statements`)

    for (const statement of statements) {
      console.log(`Executing: ${statement}`)
      await client.execute(statement + ';')
    }

    console.log('Migration completed successfully!')

    // Verify tables after migration
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';")
    console.log('Tables in database:', tables.rows)

    // Verify the unique index was created
    const indices = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_measurements_client_id_unique';"
    )
    console.log('Index created:', indices.rows)

    return true
  } catch (error) {
    console.error('Migration error:', error)
    return false
  }
}

// Run the migration
runMigration()
  .then((success: boolean) => {
    console.log('Migration script completed with status:', success ? 'SUCCESS' : 'FAILED')
    process.exit(success ? 0 : 1)
  })
  .catch((err: unknown) => {
    console.error('Unhandled error:', err)
    process.exit(1)
  })
