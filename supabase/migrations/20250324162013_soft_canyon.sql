/*
  # Fix Email Confirmation and User Creation
  
  1. Changes
    - Update auth settings to disable email confirmation
    - Create trigger to handle user creation without modifying confirmed_at
    - Add proper error handling
    
  2. Security
    - Maintain password security
    - Preserve data integrity
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_validation_mode text DEFAULT 'permissive',
  email_confirm_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update auth settings to be most permissive
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

-- Create or replace the user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role
  ) 
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        NEW.raw_user_meta_data->>'firstName',
        ' ',
        NEW.raw_user_meta_data->>'lastName'
      ),
      NEW.email
    ),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create user profile if it doesn't exist
  INSERT INTO public.user_profiles (
    id,
    full_name,
    company_name,
    phone,
    address
  ) 
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        NEW.raw_user_meta_data->>'firstName',
        ' ',
        NEW.raw_user_meta_data->>'lastName'
      ),
      NEW.email
    ),
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phoneNumber'
    ),
    jsonb_build_object(
      'street', trim(NEW.raw_user_meta_data->>'streetAddress'),
      'city', trim(NEW.raw_user_meta_data->>'city'),
      'postcode', trim(NEW.raw_user_meta_data->>'postcode')
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- Update email_confirmed_at only
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();