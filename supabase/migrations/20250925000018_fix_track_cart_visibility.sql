-- Drop the existing policy to replace it
DROP POLICY IF EXISTS "Allow read access to tracks of public projects or owned tracks" ON public.audio_tracks;

-- Create a new, more comprehensive SELECT policy for audio_tracks
CREATE POLICY "Allow read access to tracks in cart, public projects, or owned"
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
  )) OR
  -- Allow access if the track is in the user's cart
  (EXISTS (
    SELECT 1
    FROM cart_items
    JOIN carts ON cart_items.cart_id = carts.id
    WHERE cart_items.track_id = audio_tracks.id AND carts.user_id = auth.uid()
  ))
);
