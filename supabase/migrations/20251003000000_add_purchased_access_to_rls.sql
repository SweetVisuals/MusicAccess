-- Add purchased access to RLS policies for audio_tracks and project_files
-- This allows users to access tracks and files they have purchased

-- Update audio_tracks RLS policy to include purchased access
DROP POLICY IF EXISTS "audio_tracks_select_policy" ON audio_tracks;

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
  OR
  -- Allow access to purchased tracks
  EXISTS (
    SELECT 1 FROM orders o, jsonb_array_elements(o.items) item
    WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND item->>'track_id' = audio_tracks.id::text
  )
);

-- Update project_files RLS policy to include purchased access
DROP POLICY IF EXISTS "project_files_access_policy" ON project_files;

CREATE POLICY "project_files_access_policy" ON project_files
FOR SELECT
USING (
  -- Users can always view files from their own projects
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
  OR
  -- Anyone can view files from public projects
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.visibility = 'public'
  )
  OR
  -- Allow access to purchased files
  EXISTS (
    SELECT 1 FROM orders o, jsonb_array_elements(o.items) item
    WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND (
      item->>'track_id' = project_files.file_id::text
      OR
      item->>'file_id' = project_files.file_id::text
    )
  )
);