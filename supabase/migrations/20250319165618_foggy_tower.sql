/*
  # Add AWS Storage Settings
  
  1. Changes
    - Insert AWS storage settings into settings table
    - Update existing settings if they exist
    
  2. Security
    - Settings are protected by RLS policies from previous migrations
*/

-- Insert or update AWS settings
INSERT INTO settings (key, value)
VALUES (
  'aws_storage',
  jsonb_build_object(
    'accessKeyId', 'AKIATBRPQAGYF2MRI25R',
    'secretAccessKey', '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',
    'region', 'ap-south-1',
    'bucketName', 'embrodili'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();