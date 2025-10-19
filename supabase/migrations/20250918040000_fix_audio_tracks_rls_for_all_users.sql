DROP POLICY IF EXISTS "Enable read access for all users on audio_tracks for public projects" ON public.audio_tracks;
CREATE POLICY "Enable read access for all users" ON "public"."audio_tracks"
AS PERMISSIVE FOR SELECT
TO public
USING (true);