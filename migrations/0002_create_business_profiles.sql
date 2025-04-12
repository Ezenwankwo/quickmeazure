-- Create business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  years_in_business INTEGER,
  business_description TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  specializations TEXT,
  services TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 