-- Add price and purchase-related fields to playlists table for buyable sound packs
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS allow_downloads BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- Update cart_items table to support sound packs
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE;

-- Drop the existing constraint to add sound pack support
ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_entity_check;

-- Recreate the constraint to include playlists
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_entity_check
CHECK (
  ((track_id IS NOT NULL)::int + (project_id IS NOT NULL)::int + (service_id IS NOT NULL)::int + (playlist_id IS NOT NULL)::int) = 1
);

-- Create unique index for playlists in cart_items
DROP INDEX IF EXISTS cart_items_unique_cart_playlist;
CREATE UNIQUE INDEX cart_items_unique_cart_playlist
  ON public.cart_items (cart_id, playlist_id)
  WHERE playlist_id IS NOT NULL;

-- Update RLS policies for playlists to allow public viewing of buyable sound packs
DROP POLICY IF EXISTS "Users can view public playlists" ON playlists;
CREATE POLICY "Users can view public playlists" ON playlists
  FOR SELECT USING (is_public = TRUE OR price IS NOT NULL);

-- Add policy for purchasing sound packs (users can view buyable sound packs even if not public)
DROP POLICY IF EXISTS "Users can view buyable sound packs" ON playlists;
CREATE POLICY "Users can view buyable sound packs" ON playlists
  FOR SELECT USING (price IS NOT NULL);

-- Add policy for inserting playlists with price (only owners can set price)
DROP POLICY IF EXISTS "Users can insert their own playlists" ON playlists;
CREATE POLICY "Users can insert their own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add policy for updating playlists with price (only owners can update price)
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
CREATE POLICY "Users can update their own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Add policy for deleting playlists (only owners can delete)
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
CREATE POLICY "Users can delete their own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);