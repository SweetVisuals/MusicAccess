-- Add allow_downloads column to project_files table
ALTER TABLE project_files
ADD COLUMN allow_downloads BOOLEAN NOT NULL DEFAULT false;
