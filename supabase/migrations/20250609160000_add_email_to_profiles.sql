-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN email TEXT;

-- Update RLS policy to include email
CREATE POLICY "Users can update their email in profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Set email from auth.users for existing profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Removed foreign key constraint since we can't modify auth.users
-- Email will be maintained by application logic and triggers
