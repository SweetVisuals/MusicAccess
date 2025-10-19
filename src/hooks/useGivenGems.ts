import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth-context';

export interface GivenGem {
  id: string;
  giver_id: string;
  receiver_id: string;
  amount: number;
  status: 'active' | 'revoked';
  given_at: string;
  revoked_at?: string;
  receiver_profile?: {
    username: string;
    display_name: string;
  };
}

export function useGivenGems() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const giveGems = useCallback(async (receiverId: string, amount: number, trackId?: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('give_gems', {
        giver_id: user.id,
        receiver_id: receiverId,
        gem_amount: amount,
        track_id: trackId,
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const revokeGems = useCallback(async (givenGemsId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('revoke_gems', {
        given_gems_id: givenGemsId,
        revoker_id: user.id,
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchGivenGems = useCallback(async () => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('given_gems')
        .select(`
          *,
          receiver_profile:profiles!given_gems_receiver_id_fkey(username, display_name)
        `)
        .eq('giver_id', user.id)
        .eq('status', 'active')
        .order('given_at', { ascending: false });

      if (error) throw error;

      return data as GivenGem[];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const canRevoke = useCallback((givenAt: string) => {
    const givenTime = new Date(givenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - givenTime.getTime()) / (1000 * 60);
    return diffMinutes <= 1;
  }, []);

  return {
    giveGems,
    revokeGems,
    fetchGivenGems,
    canRevoke,
    isLoading,
  };
}