-- Add new values JSON field to measurements table
ALTER TABLE measurements ADD COLUMN values JSONB NOT NULL DEFAULT '{}';

-- Migrate existing data to the new values field
UPDATE measurements SET values = jsonb_build_object(
  'height', jsonb_build_object('value', height, 'unit', 'cm', 'name', 'Height'),
  'weight', jsonb_build_object('value', weight, 'unit', 'kg', 'name', 'Weight'),
  'bust', jsonb_build_object('value', bust, 'unit', 'cm', 'name', 'Bust'),
  'waist', jsonb_build_object('value', waist, 'unit', 'cm', 'name', 'Waist'),
  'hip', jsonb_build_object('value', hip, 'unit', 'cm', 'name', 'Hip'),
  'inseam', jsonb_build_object('value', inseam, 'unit', 'cm', 'name', 'Inseam'),
  'shoulder', jsonb_build_object('value', shoulder, 'unit', 'cm', 'name', 'Shoulder'),
  'sleeve', jsonb_build_object('value', sleeve, 'unit', 'cm', 'name', 'Sleeve'),
  'neck', jsonb_build_object('value', neck, 'unit', 'cm', 'name', 'Neck'),
  'chest', jsonb_build_object('value', chest, 'unit', 'cm', 'name', 'Chest'),
  'thigh', jsonb_build_object('value', thigh, 'unit', 'cm', 'name', 'Thigh')
)
WHERE height IS NOT NULL OR weight IS NOT NULL OR bust IS NOT NULL OR waist IS NOT NULL 
  OR hip IS NOT NULL OR inseam IS NOT NULL OR shoulder IS NOT NULL OR sleeve IS NOT NULL
  OR neck IS NOT NULL OR chest IS NOT NULL OR thigh IS NOT NULL;

-- Migrate additional measurements to the values field
UPDATE measurements SET values = values || additional_measurements
WHERE additional_measurements IS NOT NULL AND additional_measurements::text != '{}';

-- Drop the individual measurement columns
ALTER TABLE measurements 
  DROP COLUMN height,
  DROP COLUMN weight,
  DROP COLUMN bust,
  DROP COLUMN waist,
  DROP COLUMN hip,
  DROP COLUMN inseam,
  DROP COLUMN shoulder,
  DROP COLUMN sleeve,
  DROP COLUMN neck,
  DROP COLUMN chest,
  DROP COLUMN thigh,
  DROP COLUMN additional_measurements;
