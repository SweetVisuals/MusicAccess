-- Add user_id column to tracks table to match audio_tracks structure
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing tracks to set user_id from their project
UPDATE tracks
SET user_id = projects.user_id
FROM projects
WHERE tracks.project_id = projects.id AND tracks.user_id IS NULL;

-- Make user_id NOT NULL after populating
ALTER TABLE tracks
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to use user_id directly instead of project relationship
DROP POLICY IF EXISTS "Public tracks are viewable by everyone." ON tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks." ON tracks;
DROP POLICY IF EXISTS "Users can update their own tracks." ON tracks;
DROP POLICY IF EXISTS "Users can delete their own tracks." ON tracks;

-- Create new policies using user_id
CREATE POLICY "Public tracks are viewable by everyone."
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects
      WHERE projects.id = tracks.project_id AND projects.visibility = 'public'
    )
  );

CREATE POLICY "Users can insert their own tracks."
  ON tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks."
  ON tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks."
  ON tracks FOR DELETE
  USING (auth.uid() = user_id);