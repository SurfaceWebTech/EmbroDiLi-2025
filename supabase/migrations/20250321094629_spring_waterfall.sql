/*
  # Fix Email Validation and RLS Settings
  
  1. Changes
    - Update auth settings to use most permissive email validation
    - Disable email confirmation requirement
    - Ensure RLS is disabled for all tables
    - Drop any existing policies
*/

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

-- Ensure RLS is disabled for critical tables
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.settings DISABLE ROW LEVEL SECURITY;
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