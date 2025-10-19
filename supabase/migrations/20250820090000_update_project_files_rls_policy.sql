-- Update RLS policy for project_files to allow users to view their own project files
-- regardless of whether the project is public or private

DROP POLICY IF EXISTS "Public project files are viewable by everyone." ON project_files;
CREATE POLICY "Public project files are viewable by everyone."
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects
      WHERE projects.id = project_files.project_id 
      AND (projects.is_public = true OR projects.user_id = auth.uid())
    )
  );
