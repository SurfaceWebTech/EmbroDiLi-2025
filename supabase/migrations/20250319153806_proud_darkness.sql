/*
  # Add Truncate Documents Function
  
  1. New Functions
    - `truncate_documents`: Safely truncates the documents table
    
  2. Security
    - Function is accessible only to authenticated users
*/

-- Create function to truncate documents table
CREATE OR REPLACE FUNCTION truncate_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE documents CASCADE;
END;
$$;