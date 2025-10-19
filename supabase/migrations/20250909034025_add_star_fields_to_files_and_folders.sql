-- Add starred field to files table
ALTER TABLE files
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

-- Add starred field to folders table
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

-- Create index for starred files for faster queries
CREATE INDEX IF NOT EXISTS idx_files_starred ON files(starred);

-- Create index for starred folders for faster queries
CREATE INDEX IF NOT EXISTS idx_folders_starred ON folders(starred);