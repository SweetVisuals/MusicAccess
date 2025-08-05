BEGIN;
-- Completely clean up any existing versions
DO $$
BEGIN
  EXECUTE 'DROP FUNCTION IF EXISTS public.create_user_with_profile(text, text, text)';
  EXECUTE 'DROP FUNCTION IF EXISTS public.create_user_with_profile';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping functions: %', SQLERRM;
END $$;

-- Create new uniquely named function
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

  -- Create profile with detailed logging
  RAISE NOTICE 'Attempting to insert profile for user_id: %, email: %', user_id, email;
  
  -- First check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE NOTICE 'Profile already exists for user_id: %', user_id;
    UPDATE public.profiles SET email = email WHERE id = user_id;
    RAISE NOTICE 'Updated email for existing profile: %', email;
  ELSE
    -- Insert new profile
    BEGIN
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        email,
        updated_at
      ) VALUES (
        user_id,
        username,
        username,
        email,
        NOW()
      );
      COMMIT;
      RAISE NOTICE 'Successfully inserted profile with email: %', email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to insert profile: %', SQLERRM;
      ROLLBACK;
      RAISE;
    END;
  END IF;

  -- Get the actual inserted email
  SELECT p.email INTO email FROM public.profiles p WHERE p.id = user_id;
  RAISE NOTICE 'Confirmed profile email: %', email;

  -- Return success with user_id and profile data
  RETURN jsonb_build_object(
    'user_id', user_id,
    'status', 'success',
    'profile_email', (SELECT email FROM public.profiles WHERE id = user_id)
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'status', 'failed'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_with_profile_v2 TO authenticated;

COMMIT;
