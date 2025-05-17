/*
  # Create Update Customer Function
  
  1. Changes
    - Add new stored procedure for updating customer information
    - Support for updating profiles and user_profiles tables
    - Optional password update
    
  2. Security
    - Maintains password security with proper hashing
    - Preserves database integrity
*/

-- Create function to update customer information
CREATE OR REPLACE FUNCTION update_customer(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_company_name text,
  p_phone text,
  p_address jsonb,
  p_metadata jsonb,
  p_password text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _hashed_password text;
BEGIN
  -- Update auth.users table
  IF p_password IS NOT NULL AND p_password != '' THEN
    -- Hash the password if provided
    _hashed_password := crypt(p_password, gen_salt('bf'));
    
    UPDATE auth.users SET
      email = p_email,
      encrypted_password = _hashed_password,
      raw_user_meta_data = p_metadata,
      updated_at = now()
    WHERE id = p_id;
  ELSE
    -- Don't update password
    UPDATE auth.users SET
      email = p_email,
      raw_user_meta_data = p_metadata,
      updated_at = now()
    WHERE id = p_id;
  END IF;

  -- Update profiles table
  UPDATE public.profiles SET
    email = p_email,
    full_name = p_full_name,
    updated_at = now()
  WHERE id = p_id;

  -- Update user_profiles table
  UPDATE public.user_profiles SET
    full_name = p_full_name,
    company_name = p_company_name,
    phone = p_phone,
    address = p_address,
    updated_at = now()
  WHERE id = p_id;

EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE LOG 'Error in update_customer: %', SQLERRM;
  -- Re-raise the exception
  RAISE;
END;
$$;