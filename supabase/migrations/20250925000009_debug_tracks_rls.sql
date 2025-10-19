-- Debug tracks RLS - temporarily allow all users to read all tracks
DROP POLICY IF EXISTS "Public tracks are viewable by everyone." ON tracks;
DROP POLICY IF EXISTS "Users can view their own tracks." ON tracks;

-- Temporary permissive policy for debugging
CREATE POLICY "debug_tracks_read" ON tracks
FOR SELECT
USING (true);