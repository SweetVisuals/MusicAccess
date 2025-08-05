BEGIN;

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_create_wallet ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user_wallet();

COMMIT;
