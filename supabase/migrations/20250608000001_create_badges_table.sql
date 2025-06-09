-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges table
DROP POLICY IF EXISTS "Badges are viewable by everyone." ON badges;
CREATE POLICY "Badges are viewable by everyone."
  ON badges FOR SELECT
  USING (true);
