/*
  # Update Documents RLS Policies
  
  1. Changes
    - Add INSERT policy for documents table
    - Maintain existing SELECT policy
    
  2. Security
    - Allow authenticated users to insert documents
    - Maintain read access for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view documents" ON documents;

-- Create new policies
CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);