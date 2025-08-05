-- Drop the existing function to avoid any conflicts
DROP FUNCTION IF EXISTS public.get_profile_with_stats(uuid);

-- Recreate the function with the correct logic to calculate stats
CREATE OR REPLACE FUNCTION public.get_profile_with_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data json;
  stats_data json;
  result json;
  track_count integer;
  playlist_count integer;
  album_count integer;
  follower_count integer;
  gem_count integer;
  stream_count integer;
BEGIN
  -- Get profile data
  SELECT json_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'updated_at', p.updated_at,
    'professional_title', p.professional_title,
    'website_url', p.website_url,
    'social_links', p.social_links,
    'banner_url', p.banner_url,
    'bio', p.bio
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Calculate stats
  SELECT count(*) INTO track_count FROM public.audio_tracks WHERE user_id = p_user_id;
  SELECT count(*) INTO playlist_count FROM public.playlists WHERE user_id = p_user_id;
  SELECT count(*) INTO album_count FROM public.albums WHERE user_id = p_user_id;
  SELECT count(*) INTO follower_count FROM public.followers WHERE followed_id = p_user_id;
  SELECT sum(balance) INTO gem_count FROM public.wallets WHERE user_id = p_user_id;
  SELECT sum(streams) INTO stream_count FROM public.track_streams WHERE track_id IN (SELECT id FROM public.audio_tracks WHERE user_id = p_user_id);

  -- Build stats JSON
  stats_data := json_build_object(
    'user_id', p_user_id,
    'streams', COALESCE(stream_count, 0),
    'followers', COALESCE(follower_count, 0),
    'gems', COALESCE(gem_count, 0),
    'tracks', track_count,
    'playlists', playlist_count,
    'albums', album_count
  );

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
