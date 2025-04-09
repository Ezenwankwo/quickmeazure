import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';

// Function to run migrations
export const runMigrations = async () => {
  const client = createClient({
    url: 'file:./quickmeazure.db',
  });

  const db = drizzle(client);

  // This will create the tables if they don't exist
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations completed!');

  return db;
};

// Function to seed initial data
export const seedInitialData = async () => {
  const client = createClient({
    url: 'file:./quickmeazure.db',
  });

  const db = drizzle(client, { schema });

  // Seed subscription plans
  const existingPlans = await db.select().from(schema.subscriptionPlans);
  
  if (existingPlans.length === 0) {
    console.log('Seeding subscription plans...');
    await db.insert(schema.subscriptionPlans).values([
      {
        id: uuidv4(),
        name: 'Free',
        description: 'Basic plan for small tailoring businesses',
        price: 0,
        clientLimit: 100,
        features: JSON.stringify(['Up to 100 clients', 'Basic measurements', 'Payment tracking']),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Standard',
        description: 'Standard plan for growing tailoring businesses',
        price: 5000,
        clientLimit: 500,
        features: JSON.stringify([
          'Up to 500 clients', 
          'Advanced measurements', 
          'Payment tracking',
          'Style catalog',
          'Email notifications'
        ]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Premium',
        description: 'Premium plan for established tailoring businesses',
        price: 10000,
        clientLimit: null, // Unlimited
        features: JSON.stringify([
          'Unlimited clients', 
          'Advanced measurements', 
          'Payment tracking',
          'Style catalog',
          'Email notifications',
          'Analytics dashboard',
          'Priority support'
        ]),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    console.log('Subscription plans seeded!');
  }
};

// Run migrations and seed data when this file is executed directly
if (require.main === module) {
  (async () => {
    await runMigrations();
    await seedInitialData();
    process.exit(0);
  })();
}