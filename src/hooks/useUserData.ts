import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  username: string | null;
  email: string | null;
  profile_url: string | null;
}

interface UserStats {
  gems: number;
}

interface UserDataStore {
  storageUsed: number;
  storageLimit: number;
  loadingStorage: boolean;
  errorStorage: string | null;
  profile: UserProfile | null;
  userStats: UserStats | null;
  fetchStorageUsage: (userId: string) => Promise<void>;
  ensureUserProfile: (user: any) => Promise<void>;
}

const useUserData = create<UserDataStore>((set, get) => ({
  storageUsed: 0,
  storageLimit: 1024 * 1024 * 1024, // 1GB in bytes
  loadingStorage: false,
  errorStorage: null,
  profile: null,
  userStats: null,

  fetchStorageUsage: async (userId) => {
    set({ loadingStorage: true, errorStorage: null });
    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', userId);

      if (error) throw error;

      const totalSize = files?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
      set({ storageUsed: totalSize, loadingStorage: false });
    } catch (error) {
      set({
        errorStorage: error instanceof Error ? error.message : 'Failed to fetch storage usage',
        loadingStorage: false,
      });
    }
  },

  ensureUserProfile: async (user) => {
    if (!user) return;

    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
    }

    if (!profileData) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email.split('@')[0],
          email: user.email,
          profile_url: user.user_metadata?.avatar_url,
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
      } else {
        set({ profile: newProfile });
      }
    } else {
      set({ profile: profileData });
    }

    // Check if user_stats exists
    const { data: userStatsData, error: userStatsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userStatsError && userStatsError.code !== 'PGRST116') {
      console.error('Error checking user_stats:', userStatsError);
    }

    if (!userStatsData) {
      // Create user_stats if it doesn't exist
      const { data: newUserStats, error: createUserStatsError } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id, gems: 0 })
        .select()
        .single();

      if (createUserStatsError) {
        console.error('Error creating user_stats:', createUserStatsError);
      } else {
        set({ userStats: newUserStats });
      }
    } else {
      set({ userStats: userStatsData });
    }
  },
}));

export default useUserData;
