DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Free', 'Admin');
    ELSE
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Free';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Admin';
    END IF;
END$$;
