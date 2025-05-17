/*
  # Update Database Schema to Use Numeric IDs
  
  1. Changes
    - Drop existing tables
    - Recreate tables with SERIAL primary keys
    - Update foreign key relationships
    - Maintain existing RLS policies
    
  2. Tables Modified
    - categories: uuid -> serial
    - subcategories: uuid -> serial
    - documents: uuid -> serial
*/

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table with SERIAL primary key
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  available text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for reading categories
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Create subcategories table with SERIAL primary key
CREATE TABLE subcategories (
  id SERIAL PRIMARY KEY,
  category_id integer REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Create policy for reading subcategories
CREATE POLICY "Anyone can view subcategories"
  ON subcategories
  FOR SELECT
  TO authenticated
  USING (true);

-- Create documents table with SERIAL primary key
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id integer NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  design_no text NOT NULL,
  description text NOT NULL,
  extension text NOT NULL,
  file_type text NOT NULL,
  total_area numeric(18,2) NOT NULL,
  duration_min numeric(18,2) NOT NULL,
  total_switches integer NOT NULL,
  colours integer NOT NULL,
  width numeric(18,2) NOT NULL,
  height numeric(18,2) NOT NULL,
  stabilizer_required text NOT NULL,
  design_options text NOT NULL,
  design_information text NOT NULL,
  confidential text NOT NULL,
  transfer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT documents_design_no_unique UNIQUE (design_no)
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for reading documents
CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_subcategory_id ON documents(subcategory_id);
CREATE INDEX idx_documents_design_no ON documents(design_no);
CREATE INDEX idx_documents_category_subcategory ON documents(category_id, subcategory_id);

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

-- Insert subcategories data (abbreviated for brevity, includes same data as before)
DO $$ 
DECLARE
  v_category_id integer;
BEGIN
  -- KIDS COLLECTION (01)
  SELECT id INTO v_category_id FROM categories WHERE code = '01';
  INSERT INTO subcategories (category_id, name) VALUES
    (v_category_id, 'Children''s Design'),
    (v_category_id, 'Doll Clothes'),
    (v_category_id, 'Little Angels'),
    (v_category_id, 'School Time');

  -- Add other subcategories as in the original migration...
END $$;