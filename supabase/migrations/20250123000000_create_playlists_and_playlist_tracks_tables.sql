-- Create playlists table (if it doesn't exist)
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        cover_art_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
EXCEPTION
    WHEN duplicate_table THEN
        -- Table already exists, do nothing
        NULL;
END $$;

-- Create playlist_tracks table (if it doesn't exist)
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS playlist_tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(playlist_id, track_id)
    );
EXCEPTION
    WHEN duplicate_table THEN
        -- Table already exists, do nothing
        NULL;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);

-- Enable RLS (if not already enabled)
DO $$ BEGIN
    ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN
        -- RLS might already be enabled, continue
        NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN
        -- RLS might already be enabled, continue
        NULL;
END $$;

-- RLS Policies for playlists (create only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Users can view their own playlists') THEN
        CREATE POLICY "Users can view their own playlists" ON playlists
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Users can view public playlists') THEN
        CREATE POLICY "Users can view public playlists" ON playlists
            FOR SELECT USING (is_public = TRUE);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Users can insert their own playlists') THEN
        CREATE POLICY "Users can insert their own playlists" ON playlists
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Users can update their own playlists') THEN
        CREATE POLICY "Users can update their own playlists" ON playlists
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlists' AND policyname = 'Users can delete their own playlists') THEN
        CREATE POLICY "Users can delete their own playlists" ON playlists
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for playlist_tracks (create only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_tracks' AND policyname = 'Users can view tracks from their playlists') THEN
        CREATE POLICY "Users can view tracks from their playlists" ON playlist_tracks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_tracks.playlist_id
                    AND (playlists.user_id = auth.uid() OR playlists.is_public = TRUE)
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_tracks' AND policyname = 'Users can insert tracks to their playlists') THEN
        CREATE POLICY "Users can insert tracks to their playlists" ON playlist_tracks
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_tracks.playlist_id
                    AND playlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_tracks' AND policyname = 'Users can update tracks in their playlists') THEN
        CREATE POLICY "Users can update tracks in their playlists" ON playlist_tracks
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_tracks.playlist_id
                    AND playlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playlist_tracks' AND policyname = 'Users can delete tracks from their playlists') THEN
        CREATE POLICY "Users can delete tracks from their playlists" ON playlist_tracks
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_tracks.playlist_id
                    AND playlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop first if they exist to avoid conflicts)
DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
DROP TRIGGER IF EXISTS update_playlist_tracks_updated_at ON playlist_tracks;

CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlist_tracks_updated_at
    BEFORE UPDATE ON playlist_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();