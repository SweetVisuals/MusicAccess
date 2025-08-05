BEGIN;

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user_creation();

COMMIT;
