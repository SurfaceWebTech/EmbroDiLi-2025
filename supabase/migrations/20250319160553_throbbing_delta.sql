/*
  # Update Categories Table Policies
  
  1. Changes
    - Drop existing policies if they exist
    - Create new policies for authenticated users
    - Add error handling for policy creation
    
  2. Security
    - Ensure authenticated users can view all categories
    - Allow authenticated users to insert new categories
*/

DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
  DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;

  -- Create new policies
  CREATE POLICY "Anyone can view categories"
    ON categories
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Anyone can insert categories"
    ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

EXCEPTION 
  WHEN others THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;