-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to create a new profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  gems INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  tracks_uploaded INTEGER DEFAULT 0,
  collaborations INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_stats table
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User stats are viewable by everyone."
  ON public.user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stats."
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats."
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_create_stats ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_stats();

-- Function to create user_stats for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_stats when a new user is created
CREATE TRIGGER on_auth_user_created_create_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_stats();
