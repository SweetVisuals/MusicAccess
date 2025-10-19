import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/@/ui/dialog';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/@/ui/card';
import { useGemsBalance } from '@/contexts/gems-balance-context';
import { useDailyGems } from '@/hooks/useDailyGems';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Gem, Plus, History, Clock, Sparkles, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'earned' | 'spent' | 'bonus';
  description: string;
  created_at: string;
}

export function GemsDialog({ open, onOpenChange }: GemsDialogProps) {
  const { user } = useAuth();
  const { gemsBalance, refetch: refetchBalance } = useGemsBalance();
  const { canClaim, claimGems, isLoading: isClaiming, timeUntilNextClaim, lastClaimedAt, nextClaimAt } = useDailyGems();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [liveCountdown, setLiveCountdown] = useState<string>('');

  useEffect(() => {
    if (open && user) {
      fetchTransactions();
    }
  }, [open, user]);

  // Live countdown effect
  useEffect(() => {
    if (!nextClaimAt || canClaim) {
      setLiveCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const nextTime = new Date(nextClaimAt).getTime();
      const diff = nextTime - now;

      if (diff <= 0) {
        setLiveCountdown('Available now!');
        // Optionally refresh eligibility
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setLiveCountdown(`Available in ${hours}h ${minutes}m`);
      } else {
        setLiveCountdown(`Available in ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextClaimAt, canClaim]);

  const fetchTransactions = async () => {
    if (!user) return;

    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('gems_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleClaim = async () => {
    const success = await claimGems();
    if (success) {
      refetchBalance();
      fetchTransactions();
    }
  };



  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'spent':
        return <Gem className="h-4 w-4 text-red-500" />;
      case 'bonus':
        return <Gem className="h-4 w-4 text-yellow-500" />;
      default:
        return <Gem className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'spent':
        return 'text-red-600';
      case 'bonus':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-violet-500" />
            Gems
          </DialogTitle>
          <DialogDescription>
            Manage your gems and view transaction history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Section */}
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <Gem className="h-6 w-6 text-violet-500" />
                <span className="text-2xl">{gemsBalance}</span>
              </CardTitle>
              <CardDescription>Total Gems Collected</CardDescription>
            </CardHeader>
          </Card>

          {/* Daily Claim Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Daily Gems
              </CardTitle>
              <CardDescription>
                Earn 10 gems every day by logging in to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canClaim ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Daily gems available!</span>
                  </div>
                  <Button onClick={handleClaim} disabled={isClaiming} className="w-full">
                    {isClaiming ? 'Collecting...' : 'Collect Daily Gems (+10)'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {liveCountdown || timeUntilNextClaim || 'Next claim available in 24 hours'}
                    </span>
                  </div>
                  <Button disabled className="w-full">
                    Already Claimed Today
                  </Button>
                  {lastClaimedAt && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last claimed: {format(new Date(lastClaimedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Transaction History */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <History className="h-4 w-4" />
              Recent Transactions
            </h3>
            <ScrollArea className="h-64">
              {isLoadingTransactions ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-muted-foreground">No transactions yet</div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={getTransactionColor(transaction.transaction_type)}
                      >
                        {transaction.transaction_type === 'earned' ? '+' : transaction.transaction_type === 'spent' ? '-' : ''}
                        {transaction.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}