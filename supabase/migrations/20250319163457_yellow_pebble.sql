/*
  # Fix Settings Table RLS and Policies
  
  1. Changes
    - Disable RLS temporarily for settings table
    - Drop existing policies
    - Create new policies for authenticated users
    
  2. Security
    - Allow all authenticated users to read settings
    - Allow all authenticated users to insert/update settings
*/

-- Disable RLS temporarily
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can manage settings" ON settings;

-- Create new policies
CREATE POLICY "Anyone can view settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Insert default AWS settings if they don't exist
INSERT INTO settings (key, value)
VALUES (
  'aws_storage',
  '{
    "accessKeyId": "",
    "secretAccessKey": "",
    "region": "",
    "bucketName": ""
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;