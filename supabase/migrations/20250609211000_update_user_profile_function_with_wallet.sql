BEGIN;

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

  -- Create profile with email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    UPDATE public.profiles SET
      username = username,
      email = email,
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
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
  END IF;

  -- Create user wallet
  INSERT INTO public.user_wallets (user_id)
  VALUES (user_id);

  -- Return success with user_id
  RETURN jsonb_build_object(
    'user_id', user_id,
    'status', 'success',
    'email', email
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'status', 'failed'
  );
END;
$$;

COMMIT;
