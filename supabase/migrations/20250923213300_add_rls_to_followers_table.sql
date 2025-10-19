-- Enable RLS on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view followers (for public follower counts)
CREATE POLICY "Followers are viewable by everyone" ON public.followers
  FOR SELECT USING (true);

-- Allow authenticated users to follow/unfollow
CREATE POLICY "Users can insert their own follows" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.followers
  FOR DELETE USING (auth.uid() = follower_id);