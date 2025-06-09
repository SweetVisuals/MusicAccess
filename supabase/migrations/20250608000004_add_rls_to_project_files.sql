-- Enable Row Level Security for project_files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files in public projects
DROP POLICY IF EXISTS "Public project files are viewable by everyone." ON project_files;
CREATE POLICY "Public project files are viewable by everyone."
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects
      WHERE projects.id = project_files.project_id AND projects.is_public = true
    )
  );

-- Allow users to insert files into their own projects
DROP POLICY IF EXISTS "Users can insert their own project files." ON project_files;
CREATE POLICY "Users can insert their own project files."
  ON project_files FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM projects WHERE id = project_files.project_id
    )
  );

-- Allow users to update their own project files
DROP POLICY IF EXISTS "Users can update their own project files." ON project_files;
CREATE POLICY "Users can update their own project files."
  ON project_files FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM projects WHERE id = project_files.project_id
    )
  );

-- Allow users to delete their own project files
DROP POLICY IF EXISTS "Users can delete their own project files." ON project_files;
CREATE POLICY "Users can delete their own project files."
  ON project_files FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM projects WHERE id = project_files.project_id
    )
  );
