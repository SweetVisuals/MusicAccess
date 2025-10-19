-- Add missing fields to audio_tracks table to fix track visibility issues
-- These fields are expected by the application but were missing from the original schema

-- Add price field to audio_tracks table
ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Add allow_download field to audio_tracks table
ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT false;

-- Add comment to document the changes
COMMENT ON COLUMN audio_tracks.price IS 'Price of the individual track (null means free)';
COMMENT ON COLUMN audio_tracks.allow_download IS 'Whether this track can be downloaded by users';

-- Update the RLS policies to ensure they still work with the new fields
-- Drop existing policies and recreate them to be safe
DROP POLICY IF EXISTS "Public audio_tracks are viewable by everyone." ON audio_tracks;
DROP POLICY IF EXISTS "Users can view their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Profile audio_tracks are viewable when browsing profiles." ON audio_tracks;
DROP POLICY IF EXISTS "Users can insert their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Users can update their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Users can delete their own audio_tracks." ON audio_tracks;

-- Recreate the correct policies that check the parent project's is_public status
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
CREATE POLICY "Users can view their own audio_tracks."
  ON audio_tracks FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own audio_tracks
CREATE POLICY "Users can insert their own audio_tracks."
  ON audio_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own audio_tracks
CREATE POLICY "Users can update their own audio_tracks."
  ON audio_tracks FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own audio_tracks
CREATE POLICY "Users can delete their own audio_tracks."
  ON audio_tracks FOR DELETE
  USING (auth.uid() = user_id);
