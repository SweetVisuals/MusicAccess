-- Add gems system to profiles table
ALTER TABLE public.profiles
ADD COLUMN gems_balance INTEGER DEFAULT 0,
ADD COLUMN last_daily_gem_claimed TIMESTAMPTZ;