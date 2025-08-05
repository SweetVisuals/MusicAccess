BEGIN;
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_user_with_profile_v2;

-- Recreate function with latest schema including email
CREATE OR REPLACE FUNCTION public.create_user_with_profile_v2(
  email text,
  password text,
  username text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  result jsonb;
BEGIN
  -- Start transaction with strict isolation
  SET LOCAL statement_timeout = '5s';
  SET LOCAL lock_timeout = '3s';

  BEGIN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      email,
      crypt(password, gen_salt('bf')),
      NULL,
      jsonb_build_object('username', username)
    ) RETURNING id INTO user_id;

    -- Return success with user_id
    result := jsonb_build_object(
      'user_id', user_id,
      'status', 'success',
      'email', email
    );

  EXCEPTION WHEN OTHERS THEN
    -- Capture error details
    result := jsonb_build_object(
      'error', SQLERRM,
      'status', 'failed'
    );
    RAISE NOTICE 'User creation failed: %', SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_with_profile_v2 TO authenticated;

COMMIT;
