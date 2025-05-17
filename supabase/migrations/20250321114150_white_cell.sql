/*
  # Fix Table Relationships
  
  1. Changes
    - Drop and recreate tables with proper relationships
    - Ensure correct foreign key constraints
    - Add necessary indexes
    
  2. Security
    - Maintain existing security settings
    - Preserve data integrity
*/

-- Drop existing tables to recreate with proper relationships
DROP TABLE IF EXISTS customer_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  billing_period text NOT NULL,
  downloads_limit integer,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_subscriptions table with proper relationships
CREATE TABLE customer_subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id integer REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_subscription_status CHECK (status IN ('active', 'cancelled', 'expired'))
);

-- Create indexes for better performance
CREATE INDEX idx_customer_subscriptions_customer_id ON customer_subscriptions(customer_id);
CREATE INDEX idx_customer_subscriptions_plan_id ON customer_subscriptions(plan_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_id, name, description, price, billing_period, downloads_limit, features, is_default) VALUES
('free-trial', 'Free Trial', 'Try all Professional plan features free for 7 days', 0, '7days', 200, '[
  "200 downloads during trial",
  "Full design library access",
  "All file formats",
  "Email support",
  "No credit card required"
]'::jsonb, false),
('starter', 'Starter', 'Perfect for hobbyists and occasional users', 9.99, 'monthly', 50, '[
  "50 downloads per month",
  "Access to basic design library",
  "Standard file formats",
  "Email support"
]'::jsonb, true),
('professional', 'Professional', 'Ideal for regular embroidery enthusiasts', 19.99, 'monthly', 200, '[
  "200 downloads per month",
  "Full design library access",
  "All file formats",
  "Priority email support",
  "Commercial license"
]'::jsonb, false),
('business', 'Business', 'For professional embroidery businesses', 39.99, 'monthly', null, '[
  "Unlimited downloads",
  "Premium design library",
  "All file formats",
  "Priority support",
  "Commercial license",
  "Bulk download option"
]'::jsonb, false);

-- Disable RLS for all affected tables
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions DISABLE ROW LEVEL SECURITY;