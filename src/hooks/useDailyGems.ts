import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth-context';
import { useToast } from './use-toast';
import { useGemsBalance } from '../contexts/gems-balance-context';

interface DailyGemsState {
  canClaim: boolean;
  isLoading: boolean;
  lastClaimedAt: string | null;
  nextClaimAt: string | null;
  timeUntilNextClaim: string | null;
}

export function useDailyGems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refetch: refetchBalance } = useGemsBalance();
  const [state, setState] = useState<DailyGemsState>({
    canClaim: false,
    isLoading: false,
    lastClaimedAt: null,
    nextClaimAt: null,
    timeUntilNextClaim: null,
  });

  useEffect(() => {
    if (user) {
      checkEligibility();
    } else {
      setState({
        canClaim: false,
        isLoading: false,
        lastClaimedAt: null,
        nextClaimAt: null,
        timeUntilNextClaim: null,
      });
    }
  }, [user]);

  const checkEligibility = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('last_daily_gem_claimed')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const lastClaim = profileData.last_daily_gem_claimed;
      const now = new Date();
      const canClaim = !lastClaim || (now.getTime() - new Date(lastClaim).getTime()) > (24 * 60 * 60 * 1000);
      const nextClaimAt = lastClaim && !canClaim ? new Date(new Date(lastClaim).getTime() + (24 * 60 * 60 * 1000)).toISOString() : null;

      setState({
        canClaim,
        isLoading: false,
        lastClaimedAt: lastClaim,
        nextClaimAt,
        timeUntilNextClaim: nextClaimAt ? `Available in ${Math.ceil((new Date(nextClaimAt).getTime() - Date.now()) / (1000 * 60 * 60))} hours` : null,
      });
    } catch (error) {
      console.error('Error checking daily gems eligibility:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const claimGems = async (): Promise<boolean> => {
    if (!user || !state.canClaim) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const now = new Date().toISOString();

      // Get current balance first
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('gems_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = profileData.gems_balance || 0;
      const newBalance = currentBalance + 10;

      // Update the profile with new gems and claim time
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gems_balance: newBalance,
          last_daily_gem_claimed: now,
          updated_at: now
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('gems_transactions')
        .insert({
          user_id: user.id,
          amount: 10,
          transaction_type: 'earned',
          description: 'Daily login reward'
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Gems Claimed!",
        description: "You received 10 gems.",
      });

      // Refresh eligibility and balance
      await checkEligibility();
      refetchBalance();

      return true;

    } catch (error) {
      console.error('Error claiming daily gems:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily gems. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  return {
    ...state,
    claimGems,
  };
}