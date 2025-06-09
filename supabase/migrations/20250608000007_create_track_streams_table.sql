-- Create track_streams table
CREATE TABLE IF NOT EXISTS track_streams (
  id BIGSERIAL PRIMARY KEY,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  streamed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_track_streams_track_id ON track_streams(track_id);
CREATE INDEX IF NOT EXISTS idx_track_streams_user_id ON track_streams(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE track_streams ENABLE ROW LEVEL SECURITY;

-- Policies for track_streams table
DROP POLICY IF EXISTS "Users can insert their own stream events." ON track_streams;
CREATE POLICY "Users can insert their own stream events."
  ON track_streams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view stream counts." ON track_streams;
CREATE POLICY "Public can view stream counts."
  ON track_streams FOR SELECT
  USING (true);
