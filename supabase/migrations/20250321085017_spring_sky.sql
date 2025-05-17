/*
  # Update Subscription Management Tables
  
  1. Changes
    - Drop existing tables if they exist
    - Recreate subscription_plans and customer_subscriptions tables
    - Add policies and default data
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
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

-- Create customer_subscriptions table
CREATE TABLE customer_subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id integer REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  downloads_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired'))
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own subscriptions"
  ON customer_subscriptions
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON customer_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default plans
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