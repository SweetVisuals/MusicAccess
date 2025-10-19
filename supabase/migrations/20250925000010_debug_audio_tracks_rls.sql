-- Debug audio_tracks RLS - temporarily allow all users to read all audio_tracks
DROP POLICY IF EXISTS "audio_tracks_access_policy" ON audio_tracks;

-- Temporary permissive policy for debugging
CREATE POLICY "debug_audio_tracks_read" ON audio_tracks
FOR SELECT
USING (true);