import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/@/ui/dialog';
import { Button } from '@/components/@/ui/button';
import { useDailyGems } from '@/hooks/useDailyGems';
import { Gem } from 'lucide-react';

interface GemClaimPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
}

export function GemClaimPopup({ open, onOpenChange, onDismiss }: GemClaimPopupProps) {
  const { canClaim, claimGems, isLoading } = useDailyGems();

  const handleClaim = async () => {
    onOpenChange(false); // Close immediately
    const success = await claimGems();
    if (success) {
      onDismiss?.(); // Dismiss so it doesn't show again
    } else {
      onOpenChange(true); // Reopen if failed
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onDismiss?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-violet-500" />
            Daily Gems Available!
          </DialogTitle>
          <DialogDescription>
            You've logged in today and can claim your daily gems reward.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-500">10</div>
            <div className="text-sm text-muted-foreground">Gems</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={handleClaim} disabled={isLoading || !canClaim}>
            {isLoading ? 'Claiming...' : 'Claim Gems'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}