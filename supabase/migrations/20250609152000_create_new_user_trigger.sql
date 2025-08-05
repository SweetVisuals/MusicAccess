-- Create a new enabled trigger for user creation
BEGIN;

-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username,
    full_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/lorelei/svg?seed=' || NEW.id
    ),
    'Free'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger that will be enabled by default
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_creation();

COMMIT;
