import { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, UserStats } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { transformProfileFromDB } from '@/lib/utils';

interface VisitingProfileState {
  profile: Profile | null;
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
}

export const useVisitingProfile = (username: string) => {
  const [state, setState] = useState<VisitingProfileState>({
    profile: null,
    stats: null,
    loading: !!username,
    error: null,
  });

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!username) {
      if (isMounted.current) {
        setState({ profile: null, stats: null, loading: false, error: 'Username is required' });
      }
      return;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (isMounted.current) {
      setState({ profile: null, stats: null, loading: true, error: null });
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (abortController.signal.aborted) return;

      if (userError || !userData?.id) {
        if (isMounted.current) {
          setState({ profile: null, stats: null, loading: false, error: 'User not found' });
        }
        return;
      }

      const userId = userData.id;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (abortController.signal.aborted) return;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile not found');
      }

      const profile = transformProfileFromDB(profileData);

      const [
        { data: tracksData },
        { data: playlistsData },
        { data: albumsData },
        { data: followersCount },
        { data: followingCount },
        { data: gemsData }
      ] = await Promise.all([
        supabase.from('audio_tracks').select('id').eq('user_id', userId),
        supabase.from('playlists').select('id').eq('user_id', userId),
        supabase.from('albums').select('id').eq('user_id', userId),
        supabase.rpc('get_followers_count', { profile_id_to_check: userId }),
        supabase.rpc('get_following_count', { profile_id_to_check: userId }),
        supabase.from('profiles').select('gems_balance').eq('id', userId).single()
      ]);

      if (abortController.signal.aborted) return;

      // Get streams count by summing streams from track_streams for user's tracks
      const { data: userTracks, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('id')
        .eq('user_id', userId);

      if (abortController.signal.aborted) return;

      let streamsCount = 0;
      if (!tracksError && userTracks && userTracks.length > 0) {
        const trackIds = userTracks.map(track => track.id);
        const { data: streamsData, error: streamsError } = await supabase
          .from('track_streams')
          .select('streams')
          .in('track_id', trackIds);

        if (!streamsError && streamsData) {
          streamsCount = streamsData.reduce((sum, record) => sum + (record.streams || 0), 0);
        }
      }

      if (abortController.signal.aborted) return;

      const statsData = {
        user_id: userId,
        streams: streamsCount,
        followers: followersCount || 0,
        following: followingCount || 0,
        gems: gemsData?.gems_balance || 0,
        tracks: tracksData?.length || 0,
        playlists: playlistsData?.length || 0,
        albums: albumsData?.length || 0,
        wallet_balance: gemsData?.gems_balance || 0,
        profile_url: profileData.avatar_url || null,
        banner_url: profileData.banner_url || null
      };

      if (isMounted.current && !abortController.signal.aborted) {
        setState({
          profile,
          stats: statsData,
          loading: false,
          error: null,
        });
      }

    } catch (error) {
      if (abortController.signal.aborted) return;
      console.error('[useVisitingProfile] Error fetching profile:', error);
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          profile: null,
          stats: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch profile'
        }));
      }
    }
  }, [username]);

  useEffect(() => {
    // Reset state when username changes
    setState({
      profile: null,
      stats: null,
      loading: !!username,
      error: null,
    });

    fetchProfile();
    
    // Cleanup function to abort ongoing request when component unmounts or username changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [username, fetchProfile]);

  const reset = useCallback(() => {
    if (isMounted.current) {
      setState({
        profile: null,
        stats: null,
        loading: true,
        error: null,
      });
    }
  }, []);

  return {
    ...state,
    refetch: fetchProfile,
    reset,
  };
};
