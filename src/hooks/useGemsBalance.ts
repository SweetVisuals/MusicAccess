import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth-context';

export function useGemsBalance() {
  const { user } = useAuth();
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGemsBalance();
    } else {
      setGemsBalance(0);
    }
  }, [user]);

  const fetchGemsBalance = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gems_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setGemsBalance(data.gems_balance || 0);
    } catch (error) {
      console.error('Error fetching gems balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    gemsBalance,
    isLoading,
    refetch: fetchGemsBalance,
  };
}