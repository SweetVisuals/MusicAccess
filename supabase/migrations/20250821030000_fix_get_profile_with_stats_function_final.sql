-- Fix get_profile_with_stats function to use only existing fields in profiles table
-- The profiles table only has: id, username, full_name, avatar_url, badge_id, updated_at

DROP FUNCTION IF EXISTS public.get_profile_with_stats(p_user_id uuid);

CREATE OR REPLACE FUNCTION public.get_profile_with_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
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
  error_message text;
BEGIN
  -- Get profile data using only existing fields
  SELECT json_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'updated_at', p.updated_at,
    'professional_title', null, -- Set to null since field doesn't exist
    'website_url', null,        -- Set to null since field doesn't exist
    'social_links', null,       -- Set to null since field doesn't exist
    'banner_url', null,         -- Set to null since field doesn't exist
    'bio', null                 -- Set to null since field doesn't exist
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Check if profile exists
  IF profile_data IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
  END IF;

  -- Calculate stats - count audio_tracks directly since it has user_id
  SELECT count(*) INTO track_count
  FROM public.audio_tracks at
  WHERE at.user_id = p_user_id;

  SELECT count(*) INTO playlist_count FROM public.playlists WHERE user_id = p_user_id;
  SELECT count(*) INTO album_count FROM public.albums WHERE user_id = p_user_id;
  SELECT count(*) INTO follower_count FROM public.followers WHERE followed_id = p_user_id;
  SELECT sum(balance) INTO gem_count FROM public.wallets WHERE user_id = p_user_id;

  -- Stream count using audio_tracks to get track IDs
  SELECT sum(streams) INTO stream_count
  FROM public.track_streams
  WHERE track_id IN (
    SELECT at.id
    FROM public.audio_tracks at
    WHERE at.user_id = p_user_id
  );

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

  -- Combine results (only profile and stats as expected by the frontend)
  result := json_build_object(
    'profile', profile_data,
    'stats', stats_data
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    result := json_build_object('error', error_message);
    RETURN result;
END;
$$;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_profile_with_stats(uuid) TO authenticated;