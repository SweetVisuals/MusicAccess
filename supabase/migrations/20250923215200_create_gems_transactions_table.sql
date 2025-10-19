-- Create gems_transactions table
CREATE TABLE public.gems_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.gems_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for gems_transactions table
CREATE POLICY "Users can view their own transactions."
  ON public.gems_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions."
  ON public.gems_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE public.gems_transactions TO authenticated;
GRANT ALL ON TABLE public.gems_transactions TO service_role;