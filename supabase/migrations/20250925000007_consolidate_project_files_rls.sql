-- Consolidate project_files RLS policy into a single comprehensive policy
-- Drop existing policy
DROP POLICY IF EXISTS "Public project files are viewable by everyone." ON project_files;

-- Create a single comprehensive policy that allows:
-- 1. Users to view files from their own projects
-- 2. Anyone to view files from public projects
CREATE POLICY "project_files_access_policy" ON project_files
FOR SELECT
USING (
  -- Users can always view files from their own projects
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
  OR
  -- Anyone can view files from public projects
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.visibility = 'public'
  )
);