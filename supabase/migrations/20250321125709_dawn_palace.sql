/*
  # Add Razorpay Settings
  
  1. Changes
    - Insert default Razorpay settings into settings table
    - Add payment_gateway field to transactions table
    - Add razorpay_payment_id field to transactions table
    
  2. Security
    - Maintain existing security settings
*/

-- Insert default Razorpay settings if they don't exist
INSERT INTO settings (key, value)
VALUES (
  'razorpay_settings',
  jsonb_build_object(
    'keyId', '',
    'keySecret', '',
    'webhookSecret', '',
    'isTestMode', true
  )
)
ON CONFLICT (key) DO NOTHING;

-- Add payment gateway and Razorpay fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'razorpay',
ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Create index for Razorpay payment ID
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment_id 
  ON transactions(razorpay_payment_id);