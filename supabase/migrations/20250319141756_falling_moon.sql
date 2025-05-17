/*
  # Create documents table and relationships
  
  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `subcategory_id` (uuid, foreign key to subcategories)
      - `design_no` (text, not null)
      - `description` (text, not null)
      - `extension` (text, not null)
      - `file_type` (text, not null)
      - `total_area` (numeric(18,2), not null)
      - `duration_min` (numeric(18,2), not null)
      - `total_switches` (integer, not null)
      - `colours` (integer, not null)
      - `width` (numeric(18,2), not null)
      - `height` (numeric(18,2), not null)
      - `stabilizer_required` (text, not null)
      - `design_options` (text, not null)
      - `design_information` (text, not null)
      - `confidential` (text, not null)
      - `transfer` (text, not null)
  
  2. Security
    - Enable RLS on documents table
    - Add policy for authenticated users to read documents
    
  3. Relationships
    - Foreign key constraints to categories and subcategories tables
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
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
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for reading documents
CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_subcategory_id ON documents(subcategory_id);
CREATE INDEX idx_documents_design_no ON documents(design_no);

-- Create trigger for updating the updated_at timestamp
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint on design_no
ALTER TABLE documents
  ADD CONSTRAINT documents_design_no_unique
  UNIQUE (design_no);

-- Add composite index for category and subcategory
CREATE INDEX idx_documents_category_subcategory 
  ON documents(category_id, subcategory_id);