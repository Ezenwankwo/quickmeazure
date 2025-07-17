-- Migration to remove automatic measurement template creation for new users
-- This removes the trigger and function that automatically creates default templates
-- when a user is registered, as template creation is now part of the onboarding process

-- Drop the trigger that automatically creates measurement templates for new users
DROP TRIGGER IF EXISTS user_created_initialize_measurements ON users;

-- Drop the function that initializes measurement templates for users
DROP FUNCTION IF EXISTS on_user_created_initialize_measurements();

-- Drop the function that creates default measurement templates
DROP FUNCTION IF EXISTS initialize_user_measurement_templates(INTEGER);

-- Note: This migration removes automatic template creation.
-- Users will now create templates manually as part of their onboarding process.