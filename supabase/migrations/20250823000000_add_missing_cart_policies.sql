-- Add missing UPDATE and DELETE policies for carts table
CREATE POLICY "Allow users to update their own cart"
ON public.carts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own cart"
ON public.carts
FOR DELETE
USING (auth.uid() = user_id);