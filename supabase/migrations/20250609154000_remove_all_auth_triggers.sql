-- Remove all triggers on auth.users that might interfere with signup
BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_create_wallet ON auth.users;

-- Also drop the trigger functions to prevent them being recreated
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_creation();
DROP FUNCTION IF EXISTS public.handle_new_user_wallet();

COMMIT;
