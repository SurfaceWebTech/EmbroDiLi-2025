/*
  # Fix User Creation and Database Structure
  
  1. Changes
    - Create missing profiles and user_profiles tables
    - Update user creation trigger
    - Ensure proper table relationships
    - Disable RLS for all tables
    
  2. Security
    - Maintain disabled RLS
    - Add proper foreign key constraints
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company_name text,
  phone text,
  address jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name text;
  _company_name text;
  _phone text;
  _address jsonb;
BEGIN
  -- Extract metadata
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
    split_part(NEW.email, '@', 1)
  );
  
  _company_name := NEW.raw_user_meta_data->>'company_name';
  _phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phoneNumber'
  );
  _address := jsonb_build_object(
    'street', NEW.raw_user_meta_data->>'streetAddress',
    'city', NEW.raw_user_meta_data->>'city',
    'postcode', NEW.raw_user_meta_data->>'postcode'
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
    _full_name,
    _company_name,
    _phone,
    _address
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON public.user_profiles(company_name);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();