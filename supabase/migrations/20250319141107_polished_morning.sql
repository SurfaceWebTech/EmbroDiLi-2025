/*
  # Create categories table
  
  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `code` (text, not null)
      - `name` (text, not null)
      - `available` (text, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on categories table
    - Add policy for authenticated users to read categories
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  available text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for reading categories
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert categories data
INSERT INTO categories (code, name, available) VALUES
  ('01', 'KIDS COLLECTION', 'remote'),
  ('02', 'CARTOONS', 'remote'),
  ('03', 'ANIMALS', 'remote'),
  ('04', 'BIRDS', 'remote'),
  ('05', 'BUTTERFLIES', 'remote'),
  ('06', 'FLOWERS', 'remote'),
  ('07', 'DRESS EMBROIDERY', 'remote'),
  ('08', 'APPLIQUE DESIGNS', 'remote'),
  ('09', 'FOOD & DRINK', 'remote'),
  ('10', 'LADIES COLLECTION', 'remote'),
  ('11', 'TRANSPORT & TRAVEL', 'remote'),
  ('12', 'SPORTS', 'remote'),
  ('13', 'CONSTRUCTIONS & HOUSE HOLD ITEMS', 'remote'),
  ('14', 'LOGOS & BADGES', 'remote'),
  ('15', 'DESIGNER FONTS', 'remote'),
  ('16', 'OCEAN', 'remote'),
  ('17', 'TOOLS & EQUIPMENTS', 'remote'),
  ('18', 'NATURE', 'remote'),
  ('19', 'LACE', 'remote'),
  ('20', 'OTHERS', 'remote');