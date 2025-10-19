import React from 'react';
import { GemsDialog } from './GemsDialog';
import { useGemsDialog } from '@/contexts/gems-dialog-context';

export function GemsDialogWrapper() {
  const { isOpen, closeDialog } = useGemsDialog();

  return (
    <GemsDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    />
  );
}