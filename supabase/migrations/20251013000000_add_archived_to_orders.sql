-- Add archived field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);

-- Update RLS policies to handle archived orders
DROP POLICY IF EXISTS "Users can view orders" ON orders;
CREATE POLICY "Users can view orders" ON orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Allow users to update their own orders (for archiving)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );