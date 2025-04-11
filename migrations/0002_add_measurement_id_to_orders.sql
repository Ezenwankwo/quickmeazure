-- Add measurement_id to orders table
BEGIN TRANSACTION;

-- Create a new temporary table with the desired structure
CREATE TABLE orders_new (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  measurement_id TEXT NOT NULL,
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
  FOREIGN KEY (measurement_id) REFERENCES measurements(id) ON DELETE CASCADE,
  FOREIGN KEY (style_id) REFERENCES styles(id)
);

-- Copy data from the original table to the new one
-- For existing rows, we'll use the first measurement for each client
INSERT INTO orders_new (
  id, client_id, measurement_id, style_id, status, due_date, 
  total_amount, deposit_amount, balance_amount, notes, created_at, updated_at
)
SELECT 
  o.id, o.client_id, 
  (SELECT m.id FROM measurements m WHERE m.client_id = o.client_id LIMIT 1) as measurement_id,
  o.style_id, o.status, o.due_date, 
  o.total_amount, o.deposit_amount, o.balance_amount, o.notes, o.created_at, o.updated_at
FROM orders o;

-- Drop the original table
DROP TABLE orders;

-- Rename the new table to the original table name
ALTER TABLE orders_new RENAME TO orders;

COMMIT; 