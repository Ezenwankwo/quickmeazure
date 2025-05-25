-- Add profile fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';

-- Create an index on business_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_business_name ON users(business_name);

-- Add a comment to the migration
COMMENT ON TABLE users IS 'User accounts with integrated profile information';
