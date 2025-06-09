-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to create a new profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_value text;
BEGIN
  role_value := NEW.raw_user_meta_data->>'role';
  RAISE NOTICE 'New user trigger fired for user ID: %, Role: %', NEW.id, role_value;

  BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8)),
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      COALESCE(role_value, 'Free')::user_role
    );
    RETURN NEW;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE WARNING 'Unique constraint violation for user ID: %. Retrying with a more unique username.', NEW.id;
      INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8) || '_' || round(extract(epoch from now()))),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(role_value, 'Free')::user_role
      );
      RETURN NEW;
    WHEN others THEN
      RAISE EXCEPTION 'An unexpected error occurred while creating profile for user ID %: %', NEW.id, SQLERRM;
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
