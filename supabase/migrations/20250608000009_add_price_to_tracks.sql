-- Add price to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Set default values for existing rows
UPDATE tracks
SET price = 2.99
WHERE price IS NULL;
