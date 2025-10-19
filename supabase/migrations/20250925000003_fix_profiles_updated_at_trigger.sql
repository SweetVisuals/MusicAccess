-- Fix any problematic triggers on profiles table that might cause timestamp issues

-- Drop any existing updated_at trigger on profiles that might be causing issues
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a proper trigger that uses NOW() for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();