/*
  # Update Documents Table

  1. Changes
    - Drop existing table if it exists
    - Create documents table with all required fields
    - Add foreign key constraints
    - Add indexes for performance
    - Enable RLS with view policy

  2. Security
    - Enable RLS
    - Add policy for authenticated users to view documents

  3. Performance
    - Add indexes for category_id, subcategory_id, and design_no
    - Add composite index for category and subcategory lookups
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  subcategory_id uuid NOT NULL,
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
  CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT documents_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
  CONSTRAINT documents_design_no_unique UNIQUE (design_no)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_subcategory_id ON documents(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_documents_design_no ON documents(design_no);
CREATE INDEX IF NOT EXISTS idx_documents_category_subcategory ON documents(category_id, subcategory_id);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for reading documents
CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);