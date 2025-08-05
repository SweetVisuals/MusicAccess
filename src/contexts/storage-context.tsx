import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface StorageContextType {
  lastUpdated: number;
  triggerStorageUpdate: () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const triggerStorageUpdate = useCallback(() => {
    setLastUpdated(Date.now());
  }, []);

  return (
    <StorageContext.Provider value={{ lastUpdated, triggerStorageUpdate }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
