-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Policies for tracks table
DROP POLICY IF EXISTS "Public tracks are viewable by everyone." ON tracks;
CREATE POLICY "Public tracks are viewable by everyone."
  ON tracks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own tracks." ON tracks;
CREATE POLICY "Users can insert their own tracks."
  ON tracks FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

DROP POLICY IF EXISTS "Users can update their own tracks." ON tracks;
CREATE POLICY "Users can update their own tracks."
  ON tracks FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

DROP POLICY IF EXISTS "Users can delete their own tracks." ON tracks;
CREATE POLICY "Users can delete their own tracks."
  ON tracks FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));
