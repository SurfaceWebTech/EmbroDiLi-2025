/*
  # Fix Authentication Settings
  
  1. Changes
    - Configure auth settings to allow any email format
    - Disable email confirmation requirement
    - Update user creation trigger
    
  2. Security
    - Maintain disabled RLS for all tables
    - Allow flexible email formats
*/

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

-- Insert or update auth settings
INSERT INTO auth.settings (email_validation_mode, email_confirm_required)
VALUES ('permissive', false)
ON CONFLICT (id) DO UPDATE
SET 
  email_validation_mode = 'permissive',
  email_confirm_required = false,
  updated_at = now();

-- Update user creation trigger to handle metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );

  -- Create user profile
  INSERT INTO public.user_profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'company_name'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all tables have RLS disabled
DO $$ 
DECLARE
  _tbl text;
BEGIN
  FOR _tbl IN (
    SELECT schemaname || '.' || tablename
    FROM pg_tables
    WHERE schemaname IN ('public', 'auth')
  ) LOOP
    EXECUTE format('ALTER TABLE %s DISABLE ROW LEVEL SECURITY', _tbl);
  END LOOP;
END $$;