-- Add track_id column to given_gems table to support track-specific gems
ALTER TABLE public.given_gems
ADD COLUMN track_id UUID REFERENCES public.audio_tracks(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX idx_given_gems_track_id ON public.given_gems(track_id);

-- Update RLS policies to allow checking track-specific gems
-- This policy allows users to check if they've given gems to a specific track
CREATE POLICY "Users can check track-specific gems they gave."
  ON public.given_gems FOR SELECT
  USING (auth.uid() = giver_id);