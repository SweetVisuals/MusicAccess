-- Add track_id column to notes table for linking notes to audio tracks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notes' AND column_name = 'track_id'
    ) THEN
        ALTER TABLE notes ADD COLUMN track_id UUID REFERENCES audio_tracks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better performance when querying notes by track
CREATE INDEX IF NOT EXISTS idx_notes_track_id ON notes(track_id);