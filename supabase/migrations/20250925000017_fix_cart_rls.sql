-- Drop the overly permissive SELECT policy on audio_tracks
DROP POLICY IF EXISTS "Allow public read access" ON public.audio_tracks;

-- Drop the existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to tracks of public projects or owned tracks" ON public.audio_tracks;

-- Create a new, more secure SELECT policy for audio_tracks
CREATE POLICY "Allow read access to tracks of public projects or owned tracks"
ON public.audio_tracks
FOR SELECT
USING (
  -- Allow access if the user owns the track
  (auth.uid() = user_id) OR
  -- Allow access if the track belongs to a public project
  (EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = audio_tracks.project_id AND (projects.is_public = true OR projects.visibility = 'public'::project_visibility)
  ))
);

-- Optional: A quick check on cart_items to ensure it's not causing the 409 conflict
-- This policy is likely fine, but let's ensure it's using WITH CHECK for inserts
ALTER POLICY "Allow users to insert items into their own cart"
ON public.cart_items
WITH CHECK ((EXISTS ( SELECT 1
   FROM carts
  WHERE ((carts.id = cart_items.cart_id) AND (carts.user_id = auth.uid())))));
