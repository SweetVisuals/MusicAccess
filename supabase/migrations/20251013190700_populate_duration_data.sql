-- Migration to populate duration data for audio tracks and files
-- This migration sets default duration values for existing audio files

-- Update audio_tracks table: set default duration values (both columns are integers)
UPDATE audio_tracks
SET duration_seconds = 180, -- Default to 3 minutes (180 seconds)
    duration = 180
WHERE duration_seconds IS NULL
  AND duration IS NULL
  AND audio_url IS NOT NULL;

-- Update files table: set default duration values for audio files
UPDATE files
SET duration_seconds = 180 -- Default to 3 minutes (180 seconds)
WHERE duration_seconds IS NULL
  AND file_type IN ('mp3', 'wav', 'stems')
  AND (file_path ILIKE '%.mp3' OR file_path ILIKE '%.wav' OR file_path ILIKE '%.flac' OR file_path ILIKE '%.aac');

-- Create a function to update duration when new audio files are uploaded
CREATE OR REPLACE FUNCTION update_file_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default duration for new audio files
  IF NEW.file_type IN ('mp3', 'wav', 'stems') AND NEW.duration_seconds IS NULL THEN
    NEW.duration_seconds := 180; -- Default 3 minutes
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new file inserts
DROP TRIGGER IF EXISTS set_default_duration_on_insert ON files;
CREATE TRIGGER set_default_duration_on_insert
  BEFORE INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_file_duration();

-- Create trigger for new audio_track inserts
CREATE OR REPLACE FUNCTION update_audio_track_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default duration for new audio tracks
  IF NEW.duration_seconds IS NULL AND NEW.duration IS NULL THEN
    NEW.duration_seconds := 180; -- Default 3 minutes
    NEW.duration := 180;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_default_duration_on_audio_track_insert ON audio_tracks;
CREATE TRIGGER set_default_duration_on_audio_track_insert
  BEFORE INSERT ON audio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_track_duration();