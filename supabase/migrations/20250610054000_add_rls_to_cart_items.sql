-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to see their own cart items
CREATE POLICY "Allow users to select their own cart items"
ON public.cart_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.carts
    WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
  )
);

-- Policy: Allow users to add items to their own cart
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

-- Policy: Allow users to update their own cart items (for save for later)
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

-- Policy: Allow users to delete items from their own cart
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
