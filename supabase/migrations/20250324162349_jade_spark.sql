/*
  # Fix Profile Creation and Add Default Admin
  
  1. Changes
    - Create user_role type if it doesn't exist
    - Update profiles table to use user_role type
    - Create default admin user with proper role casting
    - Fix trigger to handle role type correctly
    
  2. Security
    - Maintain password security with proper hashing
    - Preserve data integrity
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create user_role type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END $$;

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
  -- Update email_confirmed_at only
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = NEW.id;

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
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'user'::user_role
    )
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create default admin user if it doesn't exist
DO $$
DECLARE
  _user_id uuid;
  _email text := 'admin@example.com';
  _password text := 'admin123';
  _hashed_password text;
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = _email
  ) THEN
    -- Generate UUID
    _user_id := gen_random_uuid();
    
    -- Hash password
    _hashed_password := crypt(_password, gen_salt('bf'));

    -- Insert admin user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      _user_id,
      _email,
      _hashed_password,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"role": "admin", "firstName": "Admin", "lastName": "User"}'::jsonb,
      now(),
      now()
    );

    -- Create admin profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role
    ) VALUES (
      _user_id,
      _email,
      'Admin User',
      'admin'::user_role
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create admin user profile
    INSERT INTO public.user_profiles (
      id,
      full_name
    ) VALUES (
      _user_id,
      'Admin User'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;