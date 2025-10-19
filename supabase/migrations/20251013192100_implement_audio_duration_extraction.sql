-- Migration to implement proper audio duration extraction
-- This migration removes the artificial defaults and sets up for real duration extraction

-- Remove the default duration triggers and functions
DROP TRIGGER IF EXISTS set_default_duration_on_insert ON files;
DROP TRIGGER IF EXISTS set_default_duration_on_audio_track_insert ON audio_tracks;
DROP FUNCTION IF EXISTS update_file_duration();
DROP FUNCTION IF EXISTS update_audio_track_duration();

-- Create a function to extract duration from audio files (to be called from client-side)
CREATE OR REPLACE FUNCTION update_audio_duration(
  p_track_id UUID,
  p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE audio_tracks 
  SET duration_seconds = p_duration_seconds,
      duration = p_duration_seconds
  WHERE id = p_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update file duration
CREATE OR REPLACE FUNCTION update_file_duration_seconds(
  p_file_id UUID,
  p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE files 
  SET duration_seconds = p_duration_seconds
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_audio_duration(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_file_duration_seconds(UUID, INTEGER) TO authenticated;