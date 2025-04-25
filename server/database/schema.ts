import { pgTable, serial, text, timestamp, integer, real, jsonb, date, unique, boolean, varchar } from 'drizzle-orm/pg-core'

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  interval: text('interval').notNull(), // 'monthly', 'annual', etc.
  features: jsonb('features'), // Array of features included in the plan
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  maxClients: integer('max_clients'), // Max number of clients allowed
  maxStyles: integer('max_styles'), // Max number of styles allowed
  maxStorage: integer('max_storage'), // Storage limit in MB
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Subscriptions table to track user subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  planId: integer('plan_id').notNull().references(() => plans.id),
  status: text('status').notNull().default('active'), // active, canceled, expired, pending
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date'), // When the subscription expires
  billingPeriod: text('billing_period').notNull(), // monthly, annual
  amount: real('amount').notNull(), // Amount paid
  nextBillingDate: timestamp('next_billing_date'), // When the next payment is due
  canceledAt: timestamp('canceled_at'), // When the user canceled
  paymentMethod: text('payment_method').default('paystack'), // Payment method used
  paymentReference: varchar('payment_reference', { length: 255 }), // Reference ID from payment provider
  metadata: jsonb('metadata'), // Additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Business table (one-to-one with users)
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  logo: text('logo'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  zipCode: text('zip_code'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  taxId: text('tax_id'),
  businessType: text('business_type'),
  description: text('description'),
  socialMedia: jsonb('social_media'), // Store social media links as JSON
  operatingHours: jsonb('operating_hours'), // Store hours as JSON
  settings: jsonb('settings'), // Store business settings as JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    // Ensure one-to-one relationship with user
    userIdUnique: unique().on(table.userId),
  }
})

// Business profiles table
export const businessProfiles = pgTable('business_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  shopName: text('shop_name'),
  businessType: text('business_type'),
  yearsInBusiness: integer('years_in_business'),
  businessDescription: text('business_description'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  specializations: jsonb('specializations'),
  services: jsonb('services'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  dueDate: date('due_date'),
  totalAmount: real('total_amount').notNull().default(0),
  status: text('status').notNull().default('Pending'),
  description: text('description'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Styles table
export const styles = pgTable('styles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  details: jsonb('details'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Measurements table (one-to-one with clients)
export const measurements = pgTable('measurements', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  height: real('height'), // in cm
  weight: real('weight'), // in kg
  bust: real('bust'), // in cm
  waist: real('waist'), // in cm
  hip: real('hip'), // in cm
  inseam: real('inseam'), // in cm
  shoulder: real('shoulder'), // in cm
  sleeve: real('sleeve'), // in cm
  neck: real('neck'), // in cm
  chest: real('chest'), // in cm
  thigh: real('thigh'), // in cm
  additionalMeasurements: jsonb('additional_measurements'),
  notes: text('notes'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure one-to-one relationship with client
    clientIdUnique: unique().on(table.clientId),
  }
})

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  createdBy: text('created_by').notNull(), // User ID who created the payment
})

// Export types
export type User = typeof users.$inferSelect
export type Plan = typeof plans.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
export type Business = typeof businesses.$inferSelect
export type BusinessProfile = typeof businessProfiles.$inferSelect
export type Client = typeof clients.$inferSelect
export type Order = typeof orders.$inferSelect
export type Style = typeof styles.$inferSelect
export type Measurement = typeof measurements.$inferSelect
export type Payment = typeof payments.$inferSelect 