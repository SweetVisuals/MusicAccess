-- Fix orders RLS policy to allow guest checkout
-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

-- Create new policy that allows authenticated users to insert their own orders
-- and allows guest orders (where user_id is null)
CREATE POLICY "Users can insert orders" ON orders
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Also update the select policy to allow viewing guest orders
-- Note: The old policy name had a period at the end, so we drop both variants
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders." ON orders;

CREATE POLICY "Users can view orders" ON orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (auth.uid() IS NULL AND user_id IS NULL)
    );