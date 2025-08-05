BEGIN;

-- Drop the existing function to recreate it with the correct logic
DROP FUNCTION IF EXISTS public.create_user_with_profile_v2(text, text, text);

-- Recreate the function to properly handle user creation and profile insertion
CREATE OR REPLACE FUNCTION public.create_user_with_profile_v2(
  email text,
  password text,
  username text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  encrypted_password text;
  result jsonb;
BEGIN
  -- Encrypt the password using pgcrypto
  encrypted_password := crypt(password, gen_salt('bf'));

  -- Insert into auth.users and get the new user's ID
  INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
  VALUES (email, encrypted_password, jsonb_build_object('username', username))
  RETURNING id INTO new_user_id;

  -- Check if user creation was successful
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User creation failed in auth.users';
  END IF;

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, username, email)
  VALUES (new_user_id, username, email);

  -- Return a success response
  result := jsonb_build_object(
    'user_id', new_user_id,
    'status', 'success',
    'message', 'User and profile created successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return an error response
    result := jsonb_build_object(
      'status', 'failed',
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_with_profile_v2(text, text, text) TO authenticated;

COMMIT;
