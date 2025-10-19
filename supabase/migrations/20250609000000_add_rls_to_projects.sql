-- Policies for projects table
DROP POLICY IF EXISTS "Public projects are viewable by everyone." ON projects;
CREATE POLICY "Public projects are viewable by everyone."
  ON projects FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects." ON projects;
CREATE POLICY "Users can insert their own projects."
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects." ON projects;
CREATE POLICY "Users can update their own projects."
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects." ON projects;
CREATE POLICY "Users can delete their own projects."
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
