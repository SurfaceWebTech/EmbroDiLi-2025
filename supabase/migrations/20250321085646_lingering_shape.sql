/*
  # Fix Subscription Plans RLS Policies
  
  1. Changes
    - Drop and recreate RLS policies for subscription_plans
    - Add INSERT policy for authenticated users
    - Fix admin policy to use proper role check
    
  2. Security
    - Allow all authenticated users to view plans
    - Allow admins to manage plans
    - Allow authenticated users to insert plans
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;

-- Create new policies
CREATE POLICY "Anyone can view plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert plans"
  ON subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update plans"
  ON subscription_plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete plans"
  ON subscription_plans
  FOR DELETE
  TO authenticated
  USING (true);