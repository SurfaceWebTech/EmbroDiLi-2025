/*
  # Disable RLS for tables
  
  1. Changes
    - Disable RLS for categories table
    - Disable RLS for subcategories table
    - Disable RLS for documents table
    
  2. Notes
    - This allows public access to these tables without authentication
    - Use with caution in production environments
*/

-- Disable RLS for all tables
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;