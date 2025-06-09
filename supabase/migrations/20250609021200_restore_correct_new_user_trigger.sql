-- Drop the simplified trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Restore the original, more robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_value text;
BEGIN
  -- Extract role from user metadata
  role_value := NEW.raw_user_meta_data->>'role';

  -- Attempt to insert the new profile
  BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
    VALUES (
      NEW.id,
      -- Provide a fallback for username to prevent null constraint violations
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8)),
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE(role_value, 'Free')::user_role
    );
    RETURN NEW;
  EXCEPTION
    -- Handle unique username violations by creating a more unique username
    WHEN unique_violation THEN
      INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8) || '_' || round(extract(epoch from now()))),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(role_value, 'Free')::user_role
      );
      RETURN NEW;
    -- Catch any other unexpected errors
    WHEN others THEN
      RAISE EXCEPTION 'An unexpected error occurred while creating profile for user ID %: %', NEW.id, SQLERRM;
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the restored function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
