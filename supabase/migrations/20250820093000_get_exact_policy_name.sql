-- Get the exact policy name for project_files SELECT policy
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'project_files' 
AND schemaname = 'public'
AND cmd = 'SELECT';
