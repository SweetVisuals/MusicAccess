CREATE OR REPLACE FUNCTION delete_user_profile(user_id_to_delete UUID)
RETURNS void AS $$
DECLARE
  file_count INT;
BEGIN
  -- Check if the user has any files
  SELECT count(*) INTO file_count FROM files WHERE user_id = user_id_to_delete;

  IF file_count > 0 THEN
    RAISE EXCEPTION 'User has % files. Cannot delete profile.', file_count;
  END IF;

  -- Delete user from auth.users table
  DELETE FROM auth.users WHERE id = user_id_to_delete;

  -- The trigger on auth.users will handle deleting the public.profiles record
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_user_profile(UUID) TO authenticated;
