import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note, Track } from '@/lib/types';

interface NotesContextType {
  isOpen: boolean;
  isMinimized: boolean;
  currentNote: Note | null;
  isCreatingNewNote: boolean;
  openNotes: (track?: Track) => void;
  openNewNote: (track?: Track) => void;
  closeNotes: () => void;
  minimizeNotes: () => void;
  maximizeNotes: () => void;
  setCurrentNote: (note: Note | null) => void;
  setIsCreatingNewNote: (creating: boolean) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [associatedTrack, setAssociatedTrack] = useState<Track | null>(null);

  const openNotes = (track?: Track) => {
    setAssociatedTrack(track || null);
    setIsCreatingNewNote(false);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const openNewNote = (track?: Track) => {
    setAssociatedTrack(track || null);
    setCurrentNote(null);
    setIsCreatingNewNote(true);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeNotes = () => {
    setIsOpen(false);
    setCurrentNote(null);
    setIsCreatingNewNote(false);
    setAssociatedTrack(null);
    setIsMinimized(false);
  };

  const minimizeNotes = () => {
    setIsMinimized(true);
  };

  const maximizeNotes = () => {
    setIsMinimized(false);
  };

  const value: NotesContextType = {
    isOpen,
    isMinimized,
    currentNote,
    isCreatingNewNote,
    openNotes,
    openNewNote,
    closeNotes,
    minimizeNotes,
    maximizeNotes,
    setCurrentNote,
    setIsCreatingNewNote,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};