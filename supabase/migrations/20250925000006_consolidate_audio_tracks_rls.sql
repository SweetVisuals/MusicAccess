-- Consolidate all audio_tracks RLS policies into a single comprehensive policy
-- Drop all existing policies first
DROP POLICY IF EXISTS "Public audio_tracks are viewable by everyone." ON audio_tracks;
DROP POLICY IF EXISTS "Users can view their own audio_tracks." ON audio_tracks;
DROP POLICY IF EXISTS "Profile audio_tracks are viewable when browsing profiles." ON audio_tracks;
DROP POLICY IF EXISTS "Enable read access for all users on audio_tracks for public projects" ON audio_tracks;
DROP POLICY IF EXISTS "Enable read access for all users" ON audio_tracks;

-- Create a single comprehensive policy that allows:
-- 1. Users to view their own tracks
-- 2. Anyone to view tracks from public projects
CREATE POLICY "audio_tracks_access_policy" ON audio_tracks
FOR SELECT
USING (
  -- Users can always view their own tracks
  auth.uid() = user_id
  OR
  -- Anyone can view tracks from public projects
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = audio_tracks.project_id
    AND projects.visibility = 'public'
  )
);