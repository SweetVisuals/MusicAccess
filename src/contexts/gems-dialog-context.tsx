import React, { createContext, useContext, useState } from 'react';

interface GemsDialogContextType {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const GemsDialogContext = createContext<GemsDialogContextType | undefined>(undefined);

export function GemsDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return (
    <GemsDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
    </GemsDialogContext.Provider>
  );
}

export function useGemsDialog() {
  const context = useContext(GemsDialogContext);
  if (context === undefined) {
    throw new Error('useGemsDialog must be used within a GemsDialogProvider');
  }
  return context;
}