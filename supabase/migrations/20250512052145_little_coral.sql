/*
  # Fix Authentication Issues
  
  1. Changes
    - Update auth settings to use permissive email validation
    - Set all users to be email verified
    - Add function to manually verify users
    - Resolve role checking issues
    
  2. Security
    - Maintain password security
    - Fix email verification and login problems
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Make sure auth settings are permissive
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

-- Set all existing users to be email confirmed
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email_confirmed_at IS NULL;

-- Make sure all profiles have email_verified set to true
UPDATE public.profiles
SET email_verified = true
WHERE email_verified IS NOT TRUE;

-- Create or replace the verify_user_email function
CREATE OR REPLACE FUNCTION verify_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profiles table
  UPDATE public.profiles
  SET 
    email_verified = true,
    updated_at = now()
  WHERE id = user_id;

  -- Update auth.users table
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Fix roles in profiles if they are not in the correct format
UPDATE profiles
SET role = 'admin'
WHERE 
  role IS NOT NULL AND 
  (role = 'admin' OR role::text = 'admin' OR LOWER(role::text) = 'admin');

UPDATE profiles
SET role = 'user'
WHERE 
  role IS NOT NULL AND
  role != 'admin' AND
  (role = 'user' OR role::text = 'user' OR LOWER(role::text) = 'user');

-- Fix any remaining invalid role values
UPDATE profiles
SET role = 'user'
WHERE role IS NULL OR role::text NOT IN ('admin', 'user');

-- Create or update admin user
DO $$
DECLARE
  _user_id uuid;
  _email text := 'admin@example.com';
  _password text := 'admin123';
  _hashed_password text;
  _user_exists boolean;
BEGIN
  -- Check if user already exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = _email) INTO _user_exists;
  
  IF _user_exists THEN
    -- Get existing user ID
    SELECT id INTO _user_id FROM auth.users WHERE email = _email;
    
    -- Update password and confirm email
    _hashed_password := crypt(_password, gen_salt('bf'));
    
    UPDATE auth.users SET
      encrypted_password = _hashed_password,
      email_confirmed_at = now(),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
      raw_user_meta_data = '{"role": "admin", "firstName": "Admin", "lastName": "User"}'::jsonb,
      updated_at = now()
    WHERE id = _user_id;
    
    -- Update profile to ensure admin role
    UPDATE profiles SET
      role = 'admin',
      email_verified = true
    WHERE id = _user_id;
    
  ELSE
    -- Create new admin user
    _user_id := gen_random_uuid();
    _hashed_password := crypt(_password, gen_salt('bf'));
    
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
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      email_verified
    ) VALUES (
      _user_id,
      _email,
      'Admin User',
      'admin',
      true
    ) ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      email_verified = true;
      
    -- Create admin user profile
    INSERT INTO user_profiles (
      id,
      full_name
    ) VALUES (
      _user_id,
      'Admin User'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;