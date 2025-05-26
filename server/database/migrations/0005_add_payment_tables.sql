-- Add payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'card', 'bank', etc.
  last4 VARCHAR(4),
  expiry_month VARCHAR(2),
  expiry_year VARCHAR(4),
  brand TEXT, -- 'visa', 'mastercard', etc.
  is_default BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_id TEXT, -- ID from the payment provider
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add subscription payments table for subscription-related transactions
CREATE TABLE IF NOT EXISTS subscription_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL, -- 'successful', 'failed', 'pending'
  reference TEXT, -- Payment reference from provider
  description TEXT,
  payment_method_id INTEGER REFERENCES payment_methods(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add order payments table for order-related transactions
CREATE TABLE IF NOT EXISTS order_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL, -- 'successful', 'failed', 'pending'
  reference TEXT, -- Payment reference from provider
  description TEXT,
  payment_method_id INTEGER REFERENCES payment_methods(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_user_id ON order_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
