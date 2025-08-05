import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStorage } from '@/contexts/storage-context';
import { useAuth } from '@/contexts/auth-context';
import { UserStats } from '@/lib/types'; // Import UserStats from src/lib/types.ts

interface UserProfile {
  username: string | null;
  email: string | null;
  profile_url: string | null;
}

export default function useUserData() {
  const { user: authUser } = useAuth();
  const { lastUpdated } = useStorage();

  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(1024 * 1024 * 1024); // 1GB
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [errorStorage, setErrorStorage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const fetchStorageUsage = useCallback(async (userId: string) => {
    setLoadingStorage(true);
    setErrorStorage(null);
    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', userId);

      if (error) throw error;

      const totalSize = files?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
      setStorageUsed(totalSize);
    } catch (error) {
      setErrorStorage(error instanceof Error ? error.message : 'Failed to fetch storage usage');
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  const ensureUserProfile = useCallback(async (user: any) => {
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
        setProfile(newProfile);
      }
    } else {
      setProfile(profileData);
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
        setUserStats(newUserStats);
      }
    } else {
      setUserStats(userStatsData);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      ensureUserProfile(authUser);
      fetchStorageUsage(authUser.id);
    }
  }, [authUser, ensureUserProfile, fetchStorageUsage, lastUpdated]);

  return {
    storageUsed,
    storageLimit,
    loadingStorage,
    errorStorage,
    profile,
    userStats,
    fetchStorageUsage,
    ensureUserProfile,
  };
}
