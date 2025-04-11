-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  subscription_expiry INTEGER
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  bust REAL,
  waist REAL,
  hip REAL,
  shoulder REAL,
  sleeve REAL,
  inseam REAL,
  neck REAL,
  chest REAL,
  back REAL,
  thigh REAL,
  calf REAL,
  ankle REAL,
  wrist REAL,
  armhole REAL,
  custom_measurements TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create styles table
CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  style_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date INTEGER,
  total_amount REAL NOT NULL DEFAULT 0,
  deposit_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (style_id) REFERENCES styles(id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT,
  payment_date INTEGER NOT NULL DEFAULT (unixepoch()),
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  client_limit INTEGER,
  features TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);