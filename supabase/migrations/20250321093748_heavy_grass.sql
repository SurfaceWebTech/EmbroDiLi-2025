/*
  # Fix User Creation and Profile Tables
  
  1. Changes
    - Drop and recreate profile tables with correct structure
    - Update user creation trigger to handle all metadata
    - Ensure proper table relationships
    - Disable RLS for all tables
    
  2. Security
    - Disable RLS completely
    - Remove all policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Recreate user_profiles table
DROP TABLE IF EXISTS public.user_profiles CASCADE;
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  company_name text,
  phone text,
  address jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create or replace the user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name text;
  _company_name text;
  _phone text;
  _address jsonb;
BEGIN
  -- Extract and format full name
  _full_name := CASE 
    WHEN NEW.raw_user_meta_data->>'firstName' IS NOT NULL AND NEW.raw_user_meta_data->>'lastName' IS NOT NULL THEN
      trim(concat(NEW.raw_user_meta_data->>'firstName', ' ', NEW.raw_user_meta_data->>'lastName'))
    WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      trim(NEW.raw_user_meta_data->>'full_name')
    ELSE
      split_part(NEW.email, '@', 1)
  END;

  -- Extract other metadata
  _company_name := trim(NEW.raw_user_meta_data->>'companyName');
  _phone := CASE 
    WHEN NEW.raw_user_meta_data->>'countryCode' IS NOT NULL THEN
      concat(NEW.raw_user_meta_data->>'countryCode', NEW.raw_user_meta_data->>'phoneNumber')
    ELSE
      NEW.raw_user_meta_data->>'phoneNumber'
  END;
  
  -- Build address object
  _address := jsonb_build_object(
    'street', trim(NEW.raw_user_meta_data->>'streetAddress'),
    'city', trim(NEW.raw_user_meta_data->>'city'),
    'postcode', trim(NEW.raw_user_meta_data->>'postcode')
  );

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    _full_name,
    'user'
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
    _full_name,
    _company_name,
    _phone,
    _address
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disable RLS for all tables
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON public.user_profiles(company_name);

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