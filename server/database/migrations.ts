import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { v4 as uuidv4 } from "uuid";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to run migrations
export const runMigrations = async () => {
  const client = createClient({
    url: "file:./quickmeazure.db",
  });

  const db = drizzle(client, { schema });

  // This will create the tables if they don't exist
  console.log("Running migrations...");
  const migrationsPath = path.join(__dirname, '..', '..', 'migrations');
  console.log(`Using migrations folder: ${migrationsPath}`);
  
  try {
    // Get all migration files
    const migrationFiles = await fs.readdir(migrationsPath);
    const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql') && !file.startsWith('._'));
    
    // Sort migration files to ensure they run in order (by filename)
    sqlFiles.sort();
    
    console.log(`Found migration files: ${sqlFiles.join(', ')}`);
    
    // Execute each migration file
    for (const sqlFile of sqlFiles) {
      console.log(`Executing migration: ${sqlFile}`);
      
      // Read the SQL file
      const migrationContent = await fs.readFile(path.join(migrationsPath, sqlFile), 'utf-8');
      
      // Split the SQL file into individual statements
      const statements = migrationContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Execute each statement
      for (const statement of statements) {
        await client.execute(statement + ';');
      }
      
      console.log(`Completed migration: ${sqlFile}`);
    }

    console.log("All migrations completed!");

    // Verify tables after migration
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log("Tables in database:", tables.rows);
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }

  return db;
};

// Function to seed initial data
export const seedInitialData = async () => {
  const client = createClient({
    url: "file:./quickmeazure.db",
  });

  const db = drizzle(client, { schema });

  // Seed subscription plans
  const existingPlans = await db.select().from(schema.subscriptionPlans);

  if (existingPlans.length === 0) {
    console.log("Seeding subscription plans...");
    const plans = [
      {
        id: uuidv4(),
        name: "Free",
        description: "Basic plan for small tailoring businesses",
        price: 0,
        clientLimit: 100,
        features: JSON.stringify([
          "Up to 100 clients",
          "Basic measurements",
          "Payment tracking",
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Standard",
        description: "Standard plan for growing tailoring businesses",
        price: 5000,
        clientLimit: 500,
        features: JSON.stringify([
          "Up to 500 clients",
          "Advanced measurements",
          "Payment tracking",
          "Style catalog",
          "Email notifications",
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Premium",
        description: "Premium plan for established tailoring businesses",
        price: 10000,
        clientLimit: null, // Unlimited
        features: JSON.stringify([
          "Unlimited clients",
          "Advanced measurements",
          "Payment tracking",
          "Style catalog",
          "Email notifications",
          "Analytics dashboard",
          "Priority support",
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const plan of plans) {
      await db.insert(schema.subscriptionPlans).values(plan);
    }
    console.log("Subscription plans seeded!");
  }
};
