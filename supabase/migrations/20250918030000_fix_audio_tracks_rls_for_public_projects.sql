CREATE POLICY "Enable read access for all users on audio_tracks for public projects"
ON public.audio_tracks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE
      projects.id = audio_tracks.project_id AND
      projects.visibility = 'public'
  )
);