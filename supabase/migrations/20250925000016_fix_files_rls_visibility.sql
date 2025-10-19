-- Fix files RLS policy to use correct visibility column
-- The policy was incorrectly checking 'is_public' instead of 'visibility'

DROP POLICY IF EXISTS "Public files are viewable by everyone." ON files;
CREATE POLICY "Public files are viewable by everyone."
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM project_files
      JOIN projects ON projects.id = project_files.project_id
      WHERE project_files.file_id = files.id AND projects.visibility = 'public'
    ) OR auth.uid() = user_id
  );