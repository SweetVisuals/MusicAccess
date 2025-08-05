CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
DECLARE
  user_id_to_delete UUID;
  user_files TEXT[];
BEGIN
  -- Get the user ID from the current session
  SELECT auth.uid() INTO user_id_to_delete;

  -- Get all files owned by the user
  SELECT ARRAY(SELECT path FROM storage.objects WHERE owner = user_id_to_delete) INTO user_files;

  -- Delete user's files from storage
  IF array_length(user_files, 1) > 0 THEN
    PERFORM storage.delete_objects(user_files);
  END IF;

  -- Delete user from auth.users table
  -- The trigger on auth.users should handle deleting related data in public schema
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
