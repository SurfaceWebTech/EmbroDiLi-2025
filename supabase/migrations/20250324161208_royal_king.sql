/*
  # Fix Auth Settings and Email Confirmation
  
  1. Changes
    - Update auth settings to disable email confirmation requirement
    - Add auto-confirmation for new users
    - Update user creation trigger
    
  2. Security
    - Maintain existing security settings
*/

-- Update auth settings to disable email confirmation
UPDATE auth.settings
SET 
  email_validation_mode = 'permissive',
  email_confirm_required = false,
  updated_at = now()
WHERE id = (SELECT id FROM auth.settings LIMIT 1);

-- Insert if no settings exist
INSERT INTO auth.settings (email_validation_mode, email_confirm_required)
SELECT 'permissive', false
WHERE NOT EXISTS (SELECT 1 FROM auth.settings);

-- Update user creation trigger to auto-confirm email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      NEW.email
    ),
    'user'
  );

  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    full_name,
    company_name,
    phone,
    address
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'firstName' || ' ' || NEW.raw_user_meta_data->>'lastName',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phoneNumber'
    ),
    jsonb_build_object(
      'street', trim(NEW.raw_user_meta_data->>'streetAddress'),
      'city', trim(NEW.raw_user_meta_data->>'city'),
      'postcode', trim(NEW.raw_user_meta_data->>'postcode')
    )
  );

  -- Auto-confirm email
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now(),
      updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;