-- Final audio_tracks RLS policy
DROP POLICY IF EXISTS "debug_audio_tracks_read" ON audio_tracks;

-- Allow users to view tracks they own or tracks from public projects
CREATE POLICY "audio_tracks_select_policy" ON audio_tracks
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = audio_tracks.project_id
    AND projects.visibility = 'public'
  )
);

-- Allow users to insert their own tracks
CREATE POLICY "audio_tracks_insert_policy" ON audio_tracks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tracks
CREATE POLICY "audio_tracks_update_policy" ON audio_tracks
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own tracks
CREATE POLICY "audio_tracks_delete_policy" ON audio_tracks
FOR DELETE
USING (auth.uid() = user_id);