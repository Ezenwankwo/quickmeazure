import { runMigrations, seedInitialData } from './migrations';

async function main() {
  try {
    console.log('Starting migrations...');
    await runMigrations();
    console.log('Migrations completed successfully');
    
    console.log('Starting data seeding...');
    await seedInitialData();
    console.log('Data seeding completed successfully');
  } catch (error) {
    console.error('Error during migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
main()
  .then(() => {
    console.log('All operations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 