/*
  # Fix Transaction Table Relationships
  
  1. Changes
    - Drop and recreate foreign key relationships
    - Add missing indexes
    - Set default currency
    
  2. Security
    - Maintain data integrity with proper constraints
*/

-- First check if the constraint exists and drop it if it does
DO $$ 
BEGIN
  -- Drop subscription_id foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_subscription_id_fkey'
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions 
    DROP CONSTRAINT transactions_subscription_id_fkey;
  END IF;

  -- Drop user_id foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_user_id_fkey'
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions 
    DROP CONSTRAINT transactions_user_id_fkey;
  END IF;
END $$;

-- Add proper foreign key relationship to profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_transactions_user_id'
  ) THEN
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_transactions_subscription_id'
  ) THEN
    CREATE INDEX idx_transactions_subscription_id ON transactions(subscription_id);
  END IF;
END $$;

-- Ensure currency column exists with correct default
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency text DEFAULT 'INR';
  ELSE
    ALTER TABLE transactions ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;
END $$;

-- Add subscription_id foreign key
ALTER TABLE transactions
ADD CONSTRAINT transactions_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES user_subscriptions(id)
ON DELETE SET NULL;