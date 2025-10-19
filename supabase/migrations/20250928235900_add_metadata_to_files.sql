-- Add metadata columns to files table
ALTER TABLE files
ADD COLUMN IF NOT EXISTS bpm INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS artist TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN files.bpm IS 'Beats per minute for audio files';
COMMENT ON COLUMN files.key IS 'Musical key (e.g., C Major, A Minor)';
COMMENT ON COLUMN files.genre IS 'Music genre';
COMMENT ON COLUMN files.mood IS 'Emotional mood of the track';
COMMENT ON COLUMN files.artist IS 'Artist name for audio files';
COMMENT ON COLUMN files.year IS 'Release year for audio files';