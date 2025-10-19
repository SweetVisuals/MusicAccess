import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profile } from '@/lib/types';

interface MessagingContextType {
  isOpen: boolean;
  isMinimized: boolean;
  selectedUser: Profile | null;
  conversationId: string | null;
  isEmbeddedInPlayer: boolean;
  isGeneralMessaging: boolean;
  openMessaging: (user: Profile) => void;
  openGeneralMessaging: () => void;
  closeMessaging: () => void;
  minimizeMessaging: () => void;
  maximizeMessaging: () => void;
  setConversationId: (id: string | null) => void;
  toggleEmbeddedMessaging: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isEmbeddedInPlayer, setIsEmbeddedInPlayer] = useState(false);
  const [isGeneralMessaging, setIsGeneralMessaging] = useState(false);

  const openMessaging = (user: Profile) => {
    setSelectedUser(user);
    setIsGeneralMessaging(false);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const openGeneralMessaging = () => {
    setSelectedUser(null);
    setConversationId(null);
    setIsGeneralMessaging(true);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeMessaging = () => {
    setIsOpen(false);
    setSelectedUser(null);
    setConversationId(null);
    setIsGeneralMessaging(false);
    setIsMinimized(false);
  };

  const minimizeMessaging = () => {
    setIsMinimized(true);
  };

  const maximizeMessaging = () => {
    setIsMinimized(false);
  };

  const toggleEmbeddedMessaging = () => {
    setIsEmbeddedInPlayer(!isEmbeddedInPlayer);
  };

  const value: MessagingContextType = {
    isOpen,
    isMinimized,
    selectedUser,
    conversationId,
    isEmbeddedInPlayer,
    isGeneralMessaging,
    openMessaging,
    openGeneralMessaging,
    closeMessaging,
    minimizeMessaging,
    maximizeMessaging,
    setConversationId,
    toggleEmbeddedMessaging,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};