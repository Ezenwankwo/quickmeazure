/**
 * Migration Helper Script
 *
 * This script provides utility functions to help with the migration from
 * composables to Pinia stores in the QuickMeazure application.
 *
 * Usage:
 * - Run this script to generate a report of files that need to be updated
 * - Use the generated report to guide your migration efforts
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..')
const COMPOSABLES_TO_REPLACE = ['useSessionAuth', 'useSubscription', 'useSubscriptionManagement']

// Helper functions
function findFilesWithComposables() {
  const results = {}

  COMPOSABLES_TO_REPLACE.forEach(composable => {
    try {
      const grepCommand = `grep -r "${composable}" --include="*.vue" --include="*.ts" --include="*.js" ${ROOT_DIR}/pages ${ROOT_DIR}/components ${ROOT_DIR}/layouts ${ROOT_DIR}/plugins ${ROOT_DIR}/middleware`
      const output = execSync(grepCommand, { encoding: 'utf-8' })

      const files = output
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [filePath, match] = line.split(':', 2)
          return { filePath, match }
        })

      results[composable] = files
    } catch (error) {
      console.error(`Error searching for ${composable}:`, error.message)
      results[composable] = []
    }
  })

  return results
}

function generateMigrationReport(results) {
  let report = '# Composable Migration Report\n\n'
  report += `Generated on: ${new Date().toISOString()}\n\n`

  let totalFiles = 0

  COMPOSABLES_TO_REPLACE.forEach(composable => {
    const files = results[composable] || []
    totalFiles += files.length

    report += `## ${composable}\n\n`
    report += `Found in ${files.length} files:\n\n`

    if (files.length > 0) {
      files.forEach(({ filePath, match }) => {
        const relativePath = path.relative(ROOT_DIR, filePath)
        report += `- \`${relativePath}\`: \`${match.trim()}\`\n`
      })
    } else {
      report += 'No files found.\n'
    }

    report += '\n'
  })

  report += `## Summary\n\n`
  report += `Total files to update: ${totalFiles}\n`

  return report
}

// Main execution
function main() {
  console.log('Searching for composables to replace...')
  const results = findFilesWithComposables()

  console.log('Generating migration report...')
  const report = generateMigrationReport(results)

  const reportPath = path.join(__dirname, 'migration-report.md')
  fs.writeFileSync(reportPath, report, 'utf-8')

  console.log(`Migration report generated at: ${reportPath}`)
}

// Run the script
main()
