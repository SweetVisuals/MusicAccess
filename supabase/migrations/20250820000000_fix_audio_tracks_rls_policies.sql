-- Fix RLS policies for audio_tracks table to allow viewing tracks from public projects

-- First drop all existing policies that might conflict
DROP POLICY IF EXISTS "Public audio_tracks are viewable by everyone." ON audio_tracks;
DROP POLICY IF EXISTS "Users can view their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Profile audio_tracks are viewable when browsing profiles." ON audio_tracks;
DROP POLICY IF EXISTS "Users can insert their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Users can update their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Users can delete their own audio_tracks." ON audio_tracks;

-- Recreate the correct policies that check the parent project's is_public status
-- Public audio_tracks are viewable by everyone (when parent project is public)
-- This policy covers both general viewing and profile browsing
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

-- Add a comment to explain the policies
COMMENT ON TABLE audio_tracks IS 'Audio tracks with RLS policies that allow viewing tracks from public projects and user''s own tracks';