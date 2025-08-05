ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to select their own cart"
ON public.carts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own cart"
ON public.carts
FOR INSERT
WITH CHECK (auth.uid() = user_id);
