-- Drop the existing foreign key constraint
ALTER TABLE public.listening_sessions
DROP CONSTRAINT listening_sessions_track_id_fkey;

-- Alter the column type to UUID
ALTER TABLE public.listening_sessions
ALTER COLUMN track_id TYPE UUID USING track_id::UUID;

-- Add the new foreign key constraint with UUID type referencing audio_tracks
ALTER TABLE public.listening_sessions
ADD CONSTRAINT listening_sessions_track_id_fkey
FOREIGN KEY (track_id) REFERENCES public.audio_tracks(id) ON DELETE CASCADE;
