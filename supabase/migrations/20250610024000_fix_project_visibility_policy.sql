-- Drop the existing RLS policy that depends on is_public
DROP POLICY IF EXISTS "Public projects are viewable by everyone." ON projects;

-- Drop the old is_public column if it exists
ALTER TABLE projects DROP COLUMN IF EXISTS is_public;

-- Create the ENUM type for project visibility if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_visibility') THEN
    CREATE TYPE project_visibility AS ENUM ('public', 'unlisted', 'private');
  END IF;
END$$;

-- Add the new visibility column to the projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility project_visibility NOT NULL DEFAULT 'private';

-- Recreate the RLS policy using the new visibility column
CREATE POLICY "Public projects are viewable by everyone." ON projects
  FOR SELECT USING (visibility = 'public');
