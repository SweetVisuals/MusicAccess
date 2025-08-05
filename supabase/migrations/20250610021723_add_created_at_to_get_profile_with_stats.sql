-- Add created_at to the profile_data in get_profile_with_stats function
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
  gem_count numeric;
  stream_count integer;
  profile_exists boolean;
BEGIN
  -- Check if the profile exists to prevent errors on non-existent users
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO profile_exists;

  IF NOT profile_exists THEN
    -- Return a structured null response if the profile is not found
    RETURN json_build_object('profile', null, 'stats', null);
  END IF;

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
    'bio', p.bio,
    'created_at', p.created_at -- Add created_at here
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Calculate stats
  SELECT count(*) INTO track_count FROM public.audio_tracks WHERE user_id = p_user_id;
  SELECT count(*) INTO playlist_count FROM public.playlists WHERE user_id = p_user_id;
  SELECT count(*) INTO album_count FROM public.albums WHERE user_id = p_user_id;
  SELECT count(*) INTO follower_count FROM public.followers WHERE followed_id = p_user_id;
  
  -- Use COALESCE to handle cases where a user has no wallet, preventing null results
  SELECT COALESCE(sum(balance), 0) INTO gem_count FROM public.wallets WHERE user_id = p_user_id;
  
  -- Use a JOIN and COALESCE for efficient and safe stream counting
  SELECT COALESCE(sum(ts.streams), 0)
  INTO stream_count
  FROM public.track_streams ts
  JOIN public.audio_tracks at ON ts.track_id = at.id
  WHERE at.user_id = p_user_id;

  -- Build stats JSON
  stats_data := json_build_object(
    'user_id', p_user_id,
    'streams', stream_count,
    'followers', follower_count,
    'gems', gem_count,
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
