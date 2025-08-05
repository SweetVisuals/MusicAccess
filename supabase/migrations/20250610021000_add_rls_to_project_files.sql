CREATE POLICY "Enable insert for authenticated users only"
ON public.project_files
FOR INSERT
TO authenticated
WITH CHECK (true);
