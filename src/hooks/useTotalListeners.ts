import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export const useTotalListeners = () => {
  const { user } = useAuth();
  const [totalListeners, setTotalListeners] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTotalListeners = useCallback(async () => {
    if (!user) {
      setTotalListeners(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_total_listeners_for_user', { p_user_id: user.id });

    if (error) {
      console.error('Error fetching total listeners:', error);
      setTotalListeners(0);
    } else {
      setTotalListeners(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTotalListeners();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTotalListeners, 30000);

    return () => clearInterval(interval);
  }, [fetchTotalListeners]);

  return { totalListeners, loading };
};