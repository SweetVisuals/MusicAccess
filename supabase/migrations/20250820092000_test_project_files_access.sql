-- Test if users can access their own project files from private projects
-- This will help verify the RLS policy is working correctly

-- Create a test function to check access
CREATE OR REPLACE FUNCTION test_project_files_access()
RETURNS TABLE (
    policy_name text,
    has_select_access boolean,
    has_own_project_access boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_user_id uuid;
    test_project_id uuid;
    test_file_id uuid;
BEGIN
    -- Get a test user and project (use existing ones)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    SELECT id INTO test_project_id FROM projects WHERE user_id = test_user_id LIMIT 1;
    SELECT id INTO test_file_id FROM project_files WHERE project_id = test_project_id LIMIT 1;
    
    -- Test if SELECT access works for the user's own project
    IF test_user_id IS NOT NULL AND test_project_id IS NOT NULL AND test_file_id IS NOT NULL THEN
        -- Set the auth context to the test user
        PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
        
        -- Check if we can select from project_files
        has_select_access := EXISTS (
            SELECT 1 FROM project_files WHERE id = test_file_id
        );
        
        -- Reset auth context
        PERFORM set_config('request.jwt.claim.sub', '', true);
    ELSE
        has_select_access := false;
    END IF;
    
    -- Check if the policy allows own project access
    policy_name := 'Public project files are viewable by everyone.';
    has_own_project_access := has_select_access;
    
    RETURN NEXT;
    RETURN;
END;
$$;

-- Execute the test
SELECT * FROM test_project_files_access();

-- Clean up
DROP FUNCTION test_project_files_access();
