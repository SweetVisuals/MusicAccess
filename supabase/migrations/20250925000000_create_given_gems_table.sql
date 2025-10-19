-- Create given_gems table to track gems given to other users
CREATE TABLE public.given_gems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    given_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.given_gems ENABLE ROW LEVEL SECURITY;

-- Policies for given_gems table
-- Givers can view their given gems
CREATE POLICY "Users can view gems they gave."
  ON public.given_gems FOR SELECT
  USING (auth.uid() = giver_id);

-- Receivers can view gems given to them
CREATE POLICY "Users can view gems given to them."
  ON public.given_gems FOR SELECT
  USING (auth.uid() = receiver_id);

-- Only givers can insert (when giving gems)
CREATE POLICY "Users can insert gems they are giving."
  ON public.given_gems FOR INSERT
  WITH CHECK (auth.uid() = giver_id);

-- Only givers can update (when revoking)
CREATE POLICY "Users can update gems they gave."
  ON public.given_gems FOR UPDATE
  USING (auth.uid() = giver_id);

-- Grant permissions
GRANT ALL ON TABLE public.given_gems TO authenticated;
GRANT ALL ON TABLE public.given_gems TO service_role;

-- Create index for performance
CREATE INDEX idx_given_gems_giver_id ON public.given_gems(giver_id);
CREATE INDEX idx_given_gems_receiver_id ON public.given_gems(receiver_id);
CREATE INDEX idx_given_gems_status ON public.given_gems(status);
CREATE INDEX idx_given_gems_given_at ON public.given_gems(given_at);