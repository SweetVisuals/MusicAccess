BEGIN;

-- Drop triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_create_wallet ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_create_stats ON auth.users CASCADE;

-- Drop functions related to user creation/handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_creation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_stats() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_with_profile_v2(email text, password text, username text) CASCADE; -- Drop the old complex version

-- Drop potential triggers on public.profiles
DROP TRIGGER IF EXISTS on_profile_insert ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles CASCADE;

-- Drop potential triggers on public.user_wallets
DROP TRIGGER IF EXISTS on_wallet_insert ON public.user_wallets CASCADE;
DROP TRIGGER IF EXISTS on_wallet_update ON public.user_wallets CASCADE;

COMMIT;
