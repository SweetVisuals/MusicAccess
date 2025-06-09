-- Add tags and price to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Set default values for existing rows
UPDATE projects
SET tags = ARRAY[]::TEXT[]
WHERE tags IS NULL;

UPDATE projects
SET price = 29.99
WHERE price IS NULL;
