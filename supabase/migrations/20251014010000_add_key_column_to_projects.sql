-- Add key column to projects table for musical key information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key VARCHAR(50) DEFAULT '';

-- Update existing projects to have empty string for key if null
UPDATE projects SET key = '' WHERE key IS NULL;