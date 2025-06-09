-- Enable RLS for the folders table
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to prevent errors on re-running
DROP POLICY IF EXISTS "Allow full access to own folders" ON public.folders;
DROP POLICY IF EXISTS "Allow individual read access" ON public.folders;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.folders;
DROP POLICY IF EXISTS "Allow update for users based on user_id" ON public.folders;
DROP POLICY IF EXISTS "Allow delete for users based on user_id" ON public.folders;


-- Create policies for folders
CREATE POLICY "Allow individual read access"
ON public.folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for authenticated users"
ON public.folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update for users based on user_id"
ON public.folders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete for users based on user_id"
ON public.folders
FOR DELETE
USING (auth.uid() = user_id);
