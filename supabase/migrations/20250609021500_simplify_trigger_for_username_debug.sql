-- Drop the existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simplified function for debugging purposes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert only the user ID and username from metadata
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
EXCEPTION
  -- Catch any errors and raise a specific notice for easier debugging
  WHEN others THEN
    RAISE NOTICE 'Error in simplified handle_new_user (username debug) for user ID %: %', NEW.id, SQLERRM;
    -- Return NULL to prevent the transaction from failing, which would cause a 500 error
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to call the simplified function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
