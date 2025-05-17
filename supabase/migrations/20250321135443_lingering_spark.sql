/*
  # Fix Transactions Table Relationships
  
  1. Changes
    - Drop existing foreign key constraints
    - Add proper foreign key relationship to profiles table
    - Add necessary indexes for better performance
    
  2. Security
    - Maintain existing security settings
    - Preserve data integrity
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_subscription_id_fkey;

-- Add proper foreign key relationship to profiles
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id 
  ON transactions(subscription_id);

-- Add subscription_id foreign key if it doesn't exist
ALTER TABLE transactions
ADD CONSTRAINT transactions_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES user_subscriptions(id)
ON DELETE SET NULL;