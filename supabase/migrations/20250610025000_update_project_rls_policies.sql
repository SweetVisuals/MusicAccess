-- Drop existing policies
DROP POLICY IF EXISTS "Public projects are viewable by everyone." ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects." ON projects;
DROP POLICY IF EXISTS "Users can update their own projects." ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects." ON projects;

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by everyone." ON projects
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view their own projects." ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects." ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects." ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects." ON projects
  FOR DELETE USING (auth.uid() = user_id);
