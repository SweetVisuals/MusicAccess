BEGIN;

-- Explicitly enable pgcrypto extension in the public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

COMMIT;
