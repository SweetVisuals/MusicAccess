-- Create audio_tracks table
CREATE TABLE IF NOT EXISTS audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for audio_tracks table
DROP POLICY IF EXISTS "Public audio_tracks are viewable by everyone." ON audio_tracks;
CREATE POLICY "Public audio_tracks are viewable by everyone."
  ON audio_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = audio_tracks.project_id AND projects.is_public = true
    )
  );

-- Allow viewing tracks from user's own projects (authenticated users)
DROP POLICY IF EXISTS "Users can view their own audio_tracks." ON audio_tracks;
CREATE POLICY "Users can view their own audio_tracks."
  ON audio_tracks FOR SELECT
  USING (auth.uid() = user_id);

-- Allow viewing tracks when browsing user profiles (even without auth)
DROP POLICY IF EXISTS "Profile audio_tracks are viewable when browsing profiles." ON audio_tracks;
CREATE POLICY "Profile audio_tracks are viewable when browsing profiles."
  ON audio_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = audio_tracks.project_id
      AND projects.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can insert their own audio_tracks." ON audio_tracks;
CREATE POLICY "Users can insert their own audio_tracks."
  ON audio_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own audio_tracks." ON audio_tracks;
CREATE POLICY "Users can update their own audio_tracks."
  ON audio_tracks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own audio_tracks." ON audio_tracks;
CREATE POLICY "Users can delete their own audio_tracks."
  ON audio_tracks FOR DELETE
  USING (auth.uid() = user_id);
