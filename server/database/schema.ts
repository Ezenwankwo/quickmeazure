import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table to store tailor information
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  subscriptionPlan: text('subscription_plan').notNull().default('free'),
  subscriptionExpiry: integer('subscription_expiry', { mode: 'timestamp' })
});

// Business Profiles table
export const businessProfiles = sqliteTable('business_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shopName: text('shop_name').notNull(),
  businessType: text('business_type').notNull(),
  yearsInBusiness: integer('years_in_business'),
  businessDescription: text('business_description'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  specializations: text('specializations', { mode: 'json' }),
  services: text('services', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Clients table to store client information
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Measurements table to store client measurements
export const measurements = sqliteTable('measurements', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  // Common measurements
  bust: real('bust'),
  waist: real('waist'),
  hip: real('hip'),
  shoulder: real('shoulder'),
  sleeve: real('sleeve'),
  inseam: real('inseam'),
  neck: real('neck'),
  chest: real('chest'),
  back: real('back'),
  thigh: real('thigh'),
  calf: real('calf'),
  ankle: real('ankle'),
  wrist: real('wrist'),
  armhole: real('armhole'),
  // Additional custom measurements as JSON
  customMeasurements: text('custom_measurements', { mode: 'json' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Styles table to store style information
export const styles = sqliteTable('styles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Orders table to store order information
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  measurementId: text('measurement_id').notNull().references(() => measurements.id, { onDelete: 'cascade' }),
  styleId: text('style_id').references(() => styles.id),
  status: text('status').notNull().default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  totalAmount: real('total_amount').notNull().default(0),
  depositAmount: real('deposit_amount').default(0),
  balanceAmount: real('balance_amount').default(0),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Payments table to store payment information
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method'),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Subscription plans table
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  clientLimit: integer('client_limit'),
  features: text('features', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});