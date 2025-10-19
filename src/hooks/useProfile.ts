import { create } from 'zustand';
import { Profile, UserStats } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { transformProfileFromDB } from '@/lib/utils';

interface ProfileStore {
  profile: Profile | null;
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  abortController: AbortController | null;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (values: Partial<Profile>) => Promise<void>;
  updateStats: (values: Partial<UserStats>) => Promise<void>;
  reset: () => void;
}

const useProfile = create<ProfileStore>((set, get) => ({
  profile: null,
  stats: null,
  loading: false,
  error: null,
  currentUserId: null,
  abortController: null,
  fetchProfile: async (userId) => {
    const currentState = get();

    // Cancel any ongoing request for a different user
    if (currentState.abortController && currentState.currentUserId !== userId) {
      currentState.abortController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();

    // Reset state for new profile fetch
    set({
      currentUserId: userId,
      abortController: abortController,
      profile: null,
      stats: null,
      loading: true,
      error: null
    });

    // Add a small delay to ensure state reset is processed
    await new Promise(resolve => setTimeout(resolve, 10));

    // Check if this request was already cancelled
    if (abortController.signal.aborted) {
      return;
    }

    try {
      // Get profile data directly
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if request was cancelled during the async operation
      if (abortController.signal.aborted) {
        return;
      }

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile not found');
      }

      const profile = transformProfileFromDB(profileData);

      // Get stats using direct queries instead of problematic RPC function
      const [
        { data: tracksData, error: tracksError },
        { data: playlistsData, error: playlistsError },
        { data: albumsData, error: albumsError },
        { data: followersData, error: followersError },
        { data: walletsData, error: walletsError }
      ] = await Promise.all([
        supabase.from('audio_tracks').select('id').eq('user_id', userId),
        supabase.from('playlists').select('id').eq('user_id', userId),
        supabase.from('albums').select('id').eq('user_id', userId),
        supabase.from('followers').select('id').eq('followed_id', userId),
        supabase.from('wallets').select('balance').eq('user_id', userId)
      ]);

      // Check if request was cancelled during the stats fetch
      if (abortController.signal.aborted) {
        return;
      }

      if (tracksError) console.error('Error fetching tracks:', tracksError);
      if (playlistsError) console.error('Error fetching playlists:', playlistsError);
      if (albumsError) console.error('Error fetching albums:', albumsError);
      if (followersError) console.error('Error fetching followers:', followersError);
      if (walletsError) console.error('Error fetching wallets:', walletsError);

      // Get streams count
      let streamsCount = 0;
      if (tracksData && tracksData.length > 0) {
        const trackIds = tracksData.map(t => t.id);
        const { data: streamsData, error: streamsError } = await supabase
          .from('track_streams')
          .select('streams')
          .in('track_id', trackIds);

        if (streamsError) {
          console.error('Error fetching streams:', streamsError);
        } else {
          streamsCount = streamsData?.reduce((sum, stream) => sum + (stream.streams || 0), 0) || 0;
        }
      }

      // Final check before updating state
      if (abortController.signal.aborted) {
        return;
      }

      const statsData = {
        user_id: userId,
        streams: streamsCount,
        followers: followersData?.length || 0,
        following: 0,
        gems: walletsData?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0,
        tracks: tracksData?.length || 0,
        playlists: playlistsData?.length || 0,
        albums: albumsData?.length || 0,
        wallet_balance: walletsData?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0,
        profile_url: profileData.avatar_url || null,
        banner_url: profileData.banner_url || null
      };

      set({
        profile: profile,
        stats: statsData,
        loading: false,
        currentUserId: userId,
        abortController: null
      });
    } catch (error) {
      // Don't update state if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }

      console.error('useProfile: Error fetching profile:', error);

      set({
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        loading: false,
        currentUserId: null,
        abortController: null
      });
    }
  },
  updateProfile: async (values) => {
    if (!values.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', values.id)
        .select()
        .single();

      if (error) throw error;

      // Transform the updated data to match the Profile type
      const transformedProfile = transformProfileFromDB(data);

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...transformedProfile, id: state.profile.id } : transformedProfile
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  },
  updateStats: async (values) => {
    if (!values.user_id) return;
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .update(values)
        .eq('user_id', values.user_id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        stats: { ...state.stats, ...data }
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update stats'
      });
    }
  },
  reset: () => {
    const currentState = get();
    
    // Cancel any ongoing request
    if (currentState.abortController) {
      currentState.abortController.abort();
    }
    
    set({
      profile: null,
      stats: null,
      loading: false,
      error: null,
      currentUserId: null,
      abortController: null
    });
  },
}));

export default useProfile;
