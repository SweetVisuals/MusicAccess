-- Re-enable RLS on tracks table and create proper policy
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "debug_tracks_read" ON tracks;

-- Create proper policy that allows access to tracks from public projects or owned by user
CREATE POLICY "tracks_access_policy" ON tracks
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = tracks.project_id
    AND projects.visibility = 'public'
  )
);