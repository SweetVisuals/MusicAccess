-- Check current policies on project_files table
SELECT policyname, permissive, cmd, qual
FROM pg_policies 
WHERE tablename = 'project_files' AND schemaname = 'public';
