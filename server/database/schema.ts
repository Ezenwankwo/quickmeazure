import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  date,
  unique,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core'

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  businessName: text('business_name'),
  phone: text('phone'),
  location: text('location'),
  bio: text('bio'),
  specializations: jsonb('specializations'),
  services: jsonb('services'),
  hasCompletedSetup: boolean('has_completed_setup').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  planId: integer('plan_id')
    .notNull()
    .references(() => plans.id),
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
export const businesses = pgTable(
  'businesses',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
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
  },
  table => {
    return {
      // Ensure one-to-one relationship with user
      userIdUnique: unique().on(table.userId),
    }
  }
)

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
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
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
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
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
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  details: jsonb('details'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Measurements table (one-to-one with clients)
export const measurements = pgTable(
  'measurements',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id),
    // Use only fields that are known to exist in the database
    // We'll use the values field for all measurements
    values: jsonb('values').default({}),
    notes: text('notes'),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => {
    return {
      // Ensure one-to-one relationship with client
      clientIdUnique: unique().on(table.clientId),
    }
  }
)

// Payments table - Enhanced to support both order and subscription payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  paymentMethod: text('payment_method').notNull(),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  paymentDate: timestamp('payment_date').notNull(),
  status: text('status').notNull().default('successful'), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  provider: text('provider').default('paystack'),
  providerReference: text('provider_reference'),
  metadata: jsonb('metadata'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by'), // User ID who created the payment
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Measurement Templates
export const measurementTemplates = pgTable(
  'measurement_templates',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    gender: text('gender').notNull(), // 'male', 'female', or 'unisex'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    // Ensure unique template names per user
    uniqueNamePerUser: unique().on(table.userId, table.name),
  })
)

// Measurement Fields
export const measurementFields = pgTable(
  'measurement_fields',
  {
    id: serial('id').primaryKey(),
    templateId: integer('template_id')
      .notNull()
      .references(() => measurementTemplates.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit').notNull().default('cm'),
    isRequired: boolean('is_required').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    // Ensure unique field names per template
    uniqueFieldPerTemplate: unique().on(table.templateId, table.name),
  })
)

// Client Measurements
export const clientMeasurements = pgTable(
  'client_measurements',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    templateId: integer('template_id')
      .notNull()
      .references(() => measurementTemplates.id, { onDelete: 'cascade' }),
    values: jsonb('values').notNull(), // JSON object with fieldId: value pairs
    notes: text('notes'),
    takenAt: timestamp('taken_at').defaultNow().notNull(),
    takenBy: integer('taken_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    // Ensure one measurement record per client per template
    uniqueClientTemplate: unique().on(table.clientId, table.templateId),
  })
)

// User Measurement Settings
export const userMeasurementSettings = pgTable('user_measurement_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  defaultUnit: text('default_unit').notNull().default('cm'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Payment methods table
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(), // 'card', 'bank', etc.
  last4: varchar('last4', { length: 4 }),
  expiryMonth: varchar('expiry_month', { length: 2 }),
  expiryYear: varchar('expiry_year', { length: 4 }),
  brand: text('brand'), // 'visa', 'mastercard', etc.
  isDefault: boolean('is_default').notNull().default(false),
  provider: text('provider').notNull().default('paystack'),
  providerId: text('provider_id'), // ID from the payment provider
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Subscription Payments table for subscription-related transactions
export const subscriptionPayments = pgTable('subscription_payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  subscriptionId: integer('subscription_id')
    .references(() => subscriptions.id)
    .notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull(), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  provider: text('provider').notNull().default('paystack'),
  providerReference: text('provider_reference'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Order Payments table for order-related transactions
export const orderPayments = pgTable('order_payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull(), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  provider: text('provider').notNull().default('paystack'),
  providerReference: text('provider_reference'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Notifications table for user notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(), // 'payment', 'subscription', 'usage', 'system'
  severity: text('severity').notNull(), // 'info', 'warning', 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  actionUrl: text('action_url'),
  actionText: text('action_text'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect
export type OrderPayment = typeof orderPayments.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type PaymentMethod = typeof paymentMethods.$inferSelect
export type MeasurementTemplate = typeof measurementTemplates.$inferSelect
export type NewMeasurementTemplate = typeof measurementTemplates.$inferInsert
export type MeasurementField = typeof measurementFields.$inferSelect
export type NewMeasurementField = typeof measurementFields.$inferInsert
export type ClientMeasurement = typeof clientMeasurements.$inferSelect
export type NewClientMeasurement = typeof clientMeasurements.$inferInsert
export type UserMeasurementSettings = typeof userMeasurementSettings.$inferSelect
export type NewUserMeasurementSettings = typeof userMeasurementSettings.$inferInsert
