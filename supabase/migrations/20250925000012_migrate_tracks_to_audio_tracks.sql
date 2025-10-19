-- Migrate existing data from tracks table to audio_tracks table
-- This ensures that existing tracks are available in the correct table

INSERT INTO audio_tracks (
  id,
  project_id,
  user_id,
  title,
  artist,
  audio_url,
  duration_seconds,
  uploaded_at
)
SELECT
  id,
  project_id,
  user_id,
  title,
  artist,
  audio_url,
  duration_seconds,
  uploaded_at
FROM tracks
WHERE NOT EXISTS (
  SELECT 1 FROM audio_tracks WHERE audio_tracks.id = tracks.id
);