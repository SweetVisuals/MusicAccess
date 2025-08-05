BEGIN;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_creation();
DROP FUNCTION IF EXISTS public.handle_new_user_wallet();

COMMIT;
