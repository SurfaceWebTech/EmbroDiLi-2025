/*
  # Update Currency Settings
  
  1. Changes
    - Add currency column to subscription_plans table
    - Update existing plans with INR pricing
    - Add yearly plans with INR pricing
    
  2. Security
    - Maintain existing security settings
*/

-- Add currency column to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';

-- Update existing subscription plans with INR pricing
UPDATE subscription_plans
SET 
  price = 799,
  currency = 'INR'
WHERE plan_id = 'starter' AND billing_period = 'monthly';

UPDATE subscription_plans
SET 
  price = 1499,
  currency = 'INR'
WHERE plan_id = 'professional' AND billing_period = 'monthly';

UPDATE subscription_plans
SET 
  price = 2999,
  currency = 'INR'
WHERE plan_id = 'business' AND billing_period = 'monthly';

-- Add yearly plans
INSERT INTO subscription_plans (
  plan_id,
  name,
  description,
  price,
  currency,
  billing_period,
  downloads_limit,
  features,
  is_active,
  is_default
) VALUES
('starter-yearly', 'Starter', 'Perfect for hobbyists and occasional users', 7990, 'INR', 'yearly', 50, '[
  "50 downloads per month",
  "Access to basic design library",
  "Standard file formats",
  "Email support"
]'::jsonb, true, false),

('professional-yearly', 'Professional', 'Ideal for regular embroidery enthusiasts', 14990, 'INR', 'yearly', 200, '[
  "200 downloads per month",
  "Full design library access",
  "All file formats",
  "Priority email support",
  "Commercial license"
]'::jsonb, true, false),

('business-yearly', 'Business', 'For professional embroidery businesses', 29990, 'INR', 'yearly', null, '[
  "Unlimited downloads",
  "Premium design library",
  "All file formats",
  "Priority support",
  "Commercial license",
  "Bulk download option"
]'::jsonb, true, false)
ON CONFLICT (plan_id) DO UPDATE
SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  features = EXCLUDED.features;

-- Add currency column to transactions if it doesn't exist
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';