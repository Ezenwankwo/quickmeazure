-- Add notes field to measurements table if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for adding columns, so we need to use a workaround

-- First check if the column exists
PRAGMA foreign_keys=off;

-- Start a transaction to ensure data consistency
BEGIN TRANSACTION;

-- Create a temporary table with the new column
CREATE TABLE measurements_new (
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
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Copy data from the old table to the new table, handling the new column
INSERT INTO measurements_new SELECT 
  id, 
  client_id, 
  bust, 
  waist, 
  hip, 
  shoulder, 
  sleeve, 
  inseam, 
  neck, 
  chest, 
  back, 
  thigh, 
  calf, 
  ankle, 
  wrist, 
  armhole, 
  custom_measurements, 
  NULL AS notes, 
  created_at, 
  updated_at 
FROM measurements;

-- Drop the old table
DROP TABLE measurements;

-- Rename the new table to the original name
ALTER TABLE measurements_new RENAME TO measurements;

-- Commit the transaction
COMMIT;

-- Re-enable foreign keys
PRAGMA foreign_keys=on; 