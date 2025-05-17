/*
  # Create Auth User Table Structure
  
  1. Changes
    - Create auth schema if not exists
    - Create users table with required fields
    - Add necessary indexes and constraints
    
  2. Security
    - Disable RLS for auth tables
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz DEFAULT now(),
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz,
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_phone_key UNIQUE (phone)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS users_phone_idx ON auth.users (phone);

-- Create index on created_at for sorting and filtering
CREATE INDEX IF NOT EXISTS users_created_at_idx ON auth.users (created_at);

-- Disable RLS for auth tables
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;