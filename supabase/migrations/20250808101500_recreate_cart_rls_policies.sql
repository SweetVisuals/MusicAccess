-- Drop existing policies on carts table
DROP POLICY IF EXISTS "Allow users to select their own cart" ON public.carts;
DROP POLICY IF EXISTS "Allow users to insert their own cart" ON public.carts;
DROP POLICY IF EXISTS "Allow authenticated users to select any cart (DEBUG)" ON public.carts; -- Drop the debug policy if it exists

-- Re-enable RLS on carts table (if it was disabled for any reason)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Re-create policies for carts table
CREATE POLICY "Allow users to select their own cart"
ON public.carts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own cart"
ON public.carts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Drop existing policies on cart_items table
DROP POLICY IF EXISTS "Allow users to see their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Allow users to insert items into their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Allow users to update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Allow users to delete their own cart items" ON public.cart_items;

-- Re-enable RLS on cart_items table (if it was disabled for any reason)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Re-create policies for cart_items table
CREATE POLICY "Allow users to see their own cart items"
ON public.cart_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to insert items into their own cart"
ON public.cart_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to update their own cart items"
ON public.cart_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to delete their own cart items"
ON public.cart_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  )
);
