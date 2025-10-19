-- Add user_id column to project_contracts table (nullable first)
ALTER TABLE project_contracts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Populate user_id from projects table
UPDATE project_contracts
SET user_id = projects.user_id
FROM projects
WHERE project_contracts.project_id = projects.id;

-- Now make user_id NOT NULL
ALTER TABLE project_contracts ALTER COLUMN user_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_project_contracts_user_id ON project_contracts(user_id);

-- Update RLS policies to include user_id
DROP POLICY IF EXISTS "Authenticated users can view their own project_contracts" ON project_contracts;
DROP POLICY IF EXISTS "Authenticated users can insert their own project_contracts" ON project_contracts;
DROP POLICY IF EXISTS "Authenticated users can delete their own project_contracts" ON project_contracts;
DROP POLICY IF EXISTS "Authenticated users can update their own project_contracts" ON project_contracts;

-- Recreate policies with user_id
CREATE POLICY "Authenticated users can view their own project_contracts" ON project_contracts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own project_contracts" ON project_contracts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own project_contracts" ON project_contracts
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own project_contracts" ON project_contracts
