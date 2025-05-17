/*
  # Fix Email Validation Settings
  
  1. Changes
    - Update auth settings to use most permissive email validation
    - Disable email confirmation requirement
    - Ensure RLS is disabled
*/

-- Update auth settings to be more permissive
UPDATE auth.settings
SET 
  email_validation_mode = 'permissive',
  email_confirm_required = false,
  updated_at = now()
WHERE id = (SELECT id FROM auth.settings LIMIT 1);

-- Insert if no settings exist
INSERT INTO auth.settings (email_validation_mode, email_confirm_required)
SELECT 'permissive', false
WHERE NOT EXISTS (SELECT 1 FROM auth.settings);

-- Ensure RLS is disabled
ALTER TABLE auth.settings DISABLE ROW LEVEL SECURITY;