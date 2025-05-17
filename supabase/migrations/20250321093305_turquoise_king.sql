/*
  # Fix Auth Setup and Disable RLS
  
  1. Changes
    - Drop and recreate auth tables with correct structure
    - Update user creation trigger
    - Disable RLS for all tables
    - Drop all existing policies
    
  2. Security
    - Disable RLS completely
    - Remove all policies
    - Allow direct table access
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- Create or replace the user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );

  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    full_name,
    company_name,
    phone,
    address
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phoneNumber'
    ),
    jsonb_build_object(
      'street', NEW.raw_user_meta_data->>'streetAddress',
      'city', NEW.raw_user_meta_data->>'city',
      'postcode', NEW.raw_user_meta_data->>'postcode'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop all existing policies
DO $$ 
DECLARE
  _tbl text;
  _pol text;
BEGIN
  FOR _tbl, _pol IN (
    SELECT schemaname || '.' || tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'auth')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', _pol, _tbl);
  END LOOP;
END $$;

-- Disable RLS for all tables
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

-- Explicitly disable RLS for critical tables
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.content_sections DISABLE ROW LEVEL SECURITY;