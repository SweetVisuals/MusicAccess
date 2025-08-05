-- Drop the existing function to avoid any conflicts
DROP FUNCTION IF EXISTS public.get_profile_with_stats(uuid);

-- Recreate the function with the correct columns
CREATE OR REPLACE FUNCTION public.get_profile_with_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data json;
  stats_data json;
  result json;
BEGIN
  -- Get profile data with corrected columns
  SELECT json_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'updated_at', p.updated_at
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Get stats data (assuming user_stats table exists and has these columns)
  SELECT json_build_object(
    'user_id', s.user_id,
    'streams', s.streams,
    'followers', s.followers,
    'gems', s.gems,
    'tracks', s.tracks,
    'playlists', s.playlists,
    'albums', s.albums
  ) INTO stats_data
  FROM public.user_stats s
  WHERE s.user_id = p_user_id;

  -- Combine results
  result := json_build_object(
    'profile', profile_data,
    'stats', stats_data
  );

  RETURN result;
END;
$$;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_profile_with_stats(uuid) TO authenticated;
