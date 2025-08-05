BEGIN;

-- Drop redundant triggers on auth.users that create user wallets
DROP TRIGGER IF EXISTS create_user_wallet_on_signup ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_user_wallet_on_user_create ON auth.users CASCADE;

COMMIT;
