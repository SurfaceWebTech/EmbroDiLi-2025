/*
  # Verify and Fix Admin User
  
  1. Changes
    - Check if admin user exists, create if not
    - Update existing admin user to ensure proper role and email verification
    - Set proper password for admin user
    
  2. Security
    - Maintain password security with proper hashing
    - Fix any issues with admin authentication
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a dedicated function to ensure admin user exists and is properly configured
CREATE OR REPLACE FUNCTION ensure_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id uuid;
  _email text := 'admin@example.com';
  _password text := 'admin123';
  _hashed_password text;
  _user_exists boolean;
  _profile_exists boolean;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = _email) INTO _user_exists;
  
  -- Hash password
  _hashed_password := crypt(_password, gen_salt('bf'));
  
  IF _user_exists THEN
    -- Get existing user ID
    SELECT id INTO _user_id FROM auth.users WHERE email = _email;
    
    -- Update existing user with fresh password and confirming email
    UPDATE auth.users SET
      encrypted_password = _hashed_password,
      email_confirmed_at = now(),
      raw_user_meta_data = '{"role": "admin", "firstName": "Admin", "lastName": "User"}'::jsonb,
      updated_at = now()
    WHERE email = _email;
    
    RAISE NOTICE 'Updated existing admin user with ID: %', _user_id;
  ELSE
    -- Generate UUID for new user
    _user_id := gen_random_uuid();
    
    -- Insert new admin user
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
    
    RAISE NOTICE 'Created new admin user with ID: %', _user_id;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = _user_id) INTO _profile_exists;
  
  IF _profile_exists THEN
    -- Update existing profile
    UPDATE profiles SET
      role = 'admin',
      email_verified = true,
      updated_at = now()
    WHERE id = _user_id;
    
    RAISE NOTICE 'Updated existing admin profile';
  ELSE
    -- Create new profile
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
    );
    
    RAISE NOTICE 'Created new admin profile';
  END IF;
  
  -- Check if user_profile exists and create/update if needed
  IF EXISTS(SELECT 1 FROM user_profiles WHERE id = _user_id) THEN
    UPDATE user_profiles SET
      full_name = 'Admin User',
      updated_at = now()
    WHERE id = _user_id;
  ELSE
    INSERT INTO user_profiles (
      id,
      full_name
    ) VALUES (
      _user_id,
      'Admin User'
    );
  END IF;
  
  -- Explicitly grant admin role
  UPDATE profiles SET role = 'admin' WHERE id = _user_id;
  
  RAISE NOTICE 'Admin user setup completed successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in ensure_admin_user: %', SQLERRM;
END;
$$;

-- Run the function
SELECT ensure_admin_user();