import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';

interface GemsBalanceContextType {
  gemsBalance: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const GemsBalanceContext = createContext<GemsBalanceContextType | undefined>(undefined);

export function GemsBalanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGemsBalance = useCallback(async () => {
    if (!user) {
      setGemsBalance(0);
      return;
    }

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
      setGemsBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGemsBalance();
  }, [fetchGemsBalance]);

  const value = {
    gemsBalance,
    isLoading,
    refetch: fetchGemsBalance,
  };

  return (
    <GemsBalanceContext.Provider value={value}>
      {children}
    </GemsBalanceContext.Provider>
  );
}

export function useGemsBalance() {
  const context = useContext(GemsBalanceContext);
  if (context === undefined) {
    throw new Error('useGemsBalance must be used within a GemsBalanceProvider');
  }
  return context;
}