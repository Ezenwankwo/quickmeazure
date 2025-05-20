-- Create enum type for gender if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'unisex');
  END IF;
END $$;

-- Create measurement_templates table
CREATE TABLE IF NOT EXISTS measurement_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  gender gender_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_name_per_user UNIQUE (user_id, name)
);

-- Create measurement_fields table
CREATE TABLE IF NOT EXISTS measurement_fields (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES measurement_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'cm',
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_field_per_template UNIQUE (template_id, name)
);

-- Create client_measurements table
CREATE TABLE IF NOT EXISTS client_measurements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES measurement_templates(id) ON DELETE CASCADE,
  values JSONB NOT NULL,
  notes TEXT,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  taken_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_client_template_measurement UNIQUE (client_id, template_id)
);

-- Create user_measurement_settings table
CREATE TABLE IF NOT EXISTS user_measurement_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_unit TEXT NOT NULL DEFAULT 'cm',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_measurement_templates_user_id ON measurement_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_fields_template_id ON measurement_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_client_measurements_client_id ON client_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_client_measurements_template_id ON client_measurements(template_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_measurement_templates_updated_at
BEFORE UPDATE ON measurement_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurement_fields_updated_at
BEFORE UPDATE ON measurement_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_measurements_updated_at
BEFORE UPDATE ON client_measurements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to initialize default measurement templates for a user
CREATE OR REPLACE FUNCTION initialize_user_measurement_templates(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Insert default templates for the user
  -- Example: Basic template for men
  INSERT INTO measurement_templates (user_id, name, is_default, gender)
  VALUES (p_user_id, 'Basic Men''s Measurements', true, 'male');
  
  -- Example: Basic template for women
  INSERT INTO measurement_templates (user_id, name, is_default, gender)
  VALUES (p_user_id, 'Basic Women''s Measurements', true, 'female');
  
  -- Insert default fields for men's template
  WITH men_template AS (
    SELECT id FROM measurement_templates 
    WHERE user_id = p_user_id AND name = 'Basic Men''s Measurements' LIMIT 1
  )
  INSERT INTO measurement_fields (template_id, name, unit, is_required, display_order)
  SELECT 
    (SELECT id FROM men_template), 
    field_name, 
    'in', 
    true, 
    row_number() OVER ()
  FROM (
    VALUES 
      ('Neck'),
      ('Chest'),
      ('Waist'),
      ('Hips'),
      ('Sleeve Length'),
      ('Shirt Length'),
      ('Shoulder Width'),
      ('Bicep'),
      ('Wrist'),
      ('Thigh'),
      ('Inseam'),
      ('Outseam')
  ) AS t(field_name);
  
  -- Insert default fields for women's template
  WITH women_template AS (
    SELECT id FROM measurement_templates 
    WHERE user_id = p_user_id AND name = 'Basic Women''s Measurements' LIMIT 1
  )
  INSERT INTO measurement_fields (template_id, name, unit, is_required, display_order)
  SELECT 
    (SELECT id FROM women_template), 
    field_name, 
    'in', 
    true, 
    row_number() OVER ()
  FROM (
    VALUES 
      ('Bust'),
      ('Underbust'),
      ('Waist'),
      ('Hips'),
      ('Shoulder to Waist (Front)'),
      ('Shoulder to Waist (Back)'),
      ('Shoulder to Floor'),
      ('Dress Length'),
      ('Sleeve Length'),
      ('Bicep'),
      ('Wrist'),
      ('Thigh'),
      ('Inseam'),
      ('Outseam')
  ) AS t(field_name);
  
  -- Initialize user settings
  INSERT INTO user_measurement_settings (user_id, default_unit)
  VALUES (p_user_id, 'in')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically initialize measurement templates for new users
CREATE OR REPLACE FUNCTION on_user_created_initialize_measurements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_user_measurement_templates(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS user_created_initialize_measurements ON users;

-- Create the trigger
CREATE TRIGGER user_created_initialize_measurements
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION on_user_created_initialize_measurements();
