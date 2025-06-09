-- Clean up orphaned project_files before proceeding
DELETE FROM project_files pf
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = pf.project_id);

ALTER TABLE project_files
ADD COLUMN folder_id UUID;

-- Step 1: Create a temporary table to hold the new default folders
CREATE TEMP TABLE default_folders (
    project_id UUID PRIMARY KEY,
    folder_id UUID NOT NULL
);

-- Step 2: Populate the temporary table with a new "Default" folder for each project that has files
INSERT INTO default_folders (project_id, folder_id)
SELECT
    p.id,
    gen_random_uuid()
FROM projects p
WHERE EXISTS (SELECT 1 FROM project_files pf WHERE pf.project_id = p.id);

-- Step 3: Insert the new default folders into the actual folders table
INSERT INTO folders (id, user_id, name, parent_id)
SELECT
    df.folder_id,
    p.user_id,
    'Default',
    NULL
FROM default_folders df
JOIN projects p ON df.project_id = p.id;

-- Step 4: Update the project_files table to set the folder_id from the default_folders table
UPDATE project_files pf
SET folder_id = df.folder_id
FROM default_folders df
WHERE pf.project_id = df.project_id;

-- Step 5: Now that all folder_id's are populated, add the foreign key constraint
ALTER TABLE project_files
ADD CONSTRAINT fk_folder_id
FOREIGN KEY (folder_id)
REFERENCES folders(id)
ON DELETE CASCADE;

-- Drop the existing primary key constraint
ALTER TABLE project_files
DROP CONSTRAINT project_files_pkey;

-- Add a new surrogate primary key
ALTER TABLE project_files
ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Make file_id nullable, which is now possible
ALTER TABLE project_files
ALTER COLUMN file_id DROP NOT NULL;

-- Add a unique constraint to prevent duplicate files in the same folder
CREATE UNIQUE INDEX project_files_unique_file_in_folder_idx
ON project_files (project_id, folder_id, file_id)
WHERE file_id IS NOT NULL;

-- Add a check constraint to ensure either file_id or folder_id is not null
ALTER TABLE project_files
ADD CONSTRAINT check_file_or_folder_id
CHECK (file_id IS NOT NULL OR folder_id IS NOT NULL);
