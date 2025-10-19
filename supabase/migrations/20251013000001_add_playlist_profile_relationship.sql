-- Add foreign key relationship between playlists and profiles tables
-- This allows Supabase to understand the relationship for joins

-- First, clean up any orphaned playlists that don't have corresponding profiles
DELETE FROM playlists
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM profiles);

-- Now add the foreign key constraint
ALTER TABLE playlists
ADD CONSTRAINT playlists_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;