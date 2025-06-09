-- Enable Row Level Security for files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files in public projects
DROP POLICY IF EXISTS "Public files are viewable by everyone." ON files;
CREATE POLICY "Public files are viewable by everyone."
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM project_files
      JOIN projects ON projects.id = project_files.project_id
      WHERE project_files.file_id = files.id AND projects.is_public = true
    ) OR auth.uid() = user_id
  );

-- Allow users to insert their own files
DROP POLICY IF EXISTS "Users can insert their own files." ON files;
CREATE POLICY "Users can insert their own files."
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users can update their own files." ON files;
CREATE POLICY "Users can update their own files."
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own files." ON files;
CREATE POLICY "Users can delete their own files."
  ON files FOR DELETE
  USING (auth.uid() = user_id);
