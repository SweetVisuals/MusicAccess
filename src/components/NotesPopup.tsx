import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, Save, FileText, Plus, Music } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Input } from '@/components/@/ui/input';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/@/ui/avatar';
import { useNotes } from '@/contexts/notes-context';
import { useAuth } from '@/contexts/auth-context';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { supabase } from '@/lib/supabase';
import { Note, Track } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleTextEditor } from './notes/SimpleTextEditor';
import { RhymeHighlightProvider } from '@/contexts/rhyme-highlight-context';
import { toast } from 'sonner';

const NotesPopup: React.FC = () => {
  const { user } = useAuth();
  const { currentTrack } = useAudioPlayer();
  const {
    isOpen,
    isMinimized,
    currentNote,
    isCreatingNewNote,
    closeNotes,
    minimizeNotes,
    maximizeNotes,
    setCurrentNote,
    setIsCreatingNewNote,
  } = useNotes();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [position, setPosition] = useState(() => ({
    x: 20, // Position on left side to avoid overlap with messages widget (which is on right)
    y: 76 // Position below header (56px header + 20px margin)
  }));
  const [size, setSize] = useState({ width: 500, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Calculate safe position to avoid collisions with header, sidebar, messages popup, and other UI elements
  const getSafePosition = (x: number, y: number, width: number, height: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Avoid header (56px height) and sidebar (240px width when expanded)
    const headerHeight = 56;
    const sidebarWidth = 240;
    const audioPlayerHeight = 100; // Estimated audio player height
    
    // Safe boundaries
    const minX = sidebarWidth + 20; // Avoid sidebar + margin
    const minY = headerHeight + 20; // Avoid header + margin
    const maxX = viewportWidth - width - 20; // Right margin
    const maxY = viewportHeight - height - audioPlayerHeight - 20; // Above audio player + margin
    
    // Avoid messages popup (right side)
    const messagesWidth = 384; // Messages popup width
    const messagesHeight = 384; // Messages popup height
    const messagesX = viewportWidth - messagesWidth - 20; // Messages default position
    const messagesY = headerHeight + 20; // Messages default position below header
    
    // Check for collision with messages popup
    const wouldOverlapMessages =
      x < messagesX + messagesWidth + 10 &&
      x + width > messagesX - 10 &&
      y < messagesY + messagesHeight + 10 &&
      y + height > messagesY - 10;
    
    let safeX = x;
    let safeY = y;
    
    if (wouldOverlapMessages) {
      // If overlapping, push notes popup to the left of messages popup
      safeX = Math.max(minX, Math.min(x, messagesX - width - 20));
      safeY = Math.max(minY, Math.min(y, maxY));
    } else {
      safeX = Math.max(minX, Math.min(x, maxX));
      safeY = Math.max(minY, Math.min(y, maxY));
    }
    
    return { x: safeX, y: safeY };
  };

  // Fetch user's notes
  const fetchNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          projects(*),
          note_files(
            id,
            file_id,
            files(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data as Note[]);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // Create a new note
  const handleCreateNote = async () => {
    if (!user || !newNoteTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: newNoteTitle,
          content: newNoteContent,
          // Optionally link to current track
          ...(currentTrack && { track_id: currentTrack.id })
        })
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setNotes(prev => [data as Note, ...prev]);
        setNewNoteTitle('');
        setNewNoteContent('');
        setIsCreatingNewNote(false);
        toast.success("Note created successfully!");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  // Update an existing note
  const handleUpdateNote = async () => {
    if (!user || !currentNote) return;

    try {
      const { error } = await supabase
        .from("notes")
        .update({
          title: newNoteTitle,
          content: newNoteContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentNote.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh notes
      await fetchNotes();
      setCurrentNote(null);
      setNewNoteTitle('');
      setNewNoteContent('');
      toast.success("Note updated successfully!");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
      }
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  // Start editing a note
  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || '');
    setIsCreatingNewNote(false);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Get safe position that avoids collisions
      const safePosition = getSafePosition(newX, newY, size.width, size.height);

      setPosition(safePosition);
    } else if (isResizing) {
      const newWidth = Math.max(320, e.clientX - position.x);
      const newHeight = Math.max(300, e.clientY - position.y);
      
      // Get safe position for new size
      const safePosition = getSafePosition(position.x, position.y, newWidth, newHeight);
      
      setSize({ width: newWidth, height: newHeight });
      setPosition(safePosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing ? 'nw-resize' : 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragStart, position, size]);

  // Fetch notes when popup opens
  useEffect(() => {
    if (isOpen && user) {
      fetchNotes();
      
      // Ensure initial position is safe
      const safePosition = getSafePosition(position.x, position.y, size.width, size.height);
      if (safePosition.x !== position.x || safePosition.y !== position.y) {
        setPosition(safePosition);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={widgetRef}
        className="fixed z-[60] select-none"
        style={{
          left: position.x,
          top: position.y,
          width: isMinimized ? 320 : size.width,
          height: isMinimized ? 48 : size.height,
        }}
        initial={{ 
          opacity: 0, 
          scale: 0.8,
          y: 20
        }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: 0
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.8,
          y: 20
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        layout
      >
        <motion.div
          className="bg-card border border-border rounded-lg shadow-xl w-full h-full flex flex-col"
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Header - Drag Handle */}
          <motion.div
            className="flex items-center justify-between p-3 border-b border-border cursor-grab active:cursor-grabbing drag-handle"
            onMouseDown={handleMouseDown}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {isCreatingNewNote ? 'New Note' : currentNote ? 'Edit Note' : 'My Notes'}
                </p>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">
                    {currentTrack ? `Linked to: ${currentTrack.title}` : 'Take notes while listening'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  isMinimized ? maximizeNotes() : minimizeNotes();
                }}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  closeNotes();
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!isMinimized && (
              <motion.div
                className="flex-1 flex flex-col min-h-0 relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                layout
              >
                {isCreatingNewNote || currentNote ? (
                  // Note Editor View
                  <div className="flex-1 flex flex-col p-3 space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Note title..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="focus-visible:ring-primary"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-0">
                      <label className="text-sm font-medium mb-2">Content</label>
                      <div className="flex-1 min-h-0">
                        <RhymeHighlightProvider>
                          <SimpleTextEditor
                            value={newNoteContent}
                            onChange={setNewNoteContent}
                            placeholder="Write your notes, lyrics, or musical ideas here..."
                          />
                        </RhymeHighlightProvider>
                      </div>
                    </div>

                    {currentTrack && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                        <Music className="h-4 w-4 text-green-600" />
                        <span className="flex-1 truncate">{currentTrack.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {currentTrack.artist || 'Unknown Artist'}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentNote(null);
                          setIsCreatingNewNote(false);
                          setNewNoteTitle('');
                          setNewNoteContent('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={currentNote ? handleUpdateNote : handleCreateNote}
                        disabled={!newNoteTitle.trim()}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {currentNote ? 'Update' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Notes List View
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b border-border">
                      <Button
                        onClick={() => setIsCreatingNewNote(true)}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Note
                      </Button>
                    </div>
                    
                    <ScrollArea className="flex-1 p-3">
                      {loading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-sm text-muted-foreground">Loading notes...</div>
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No notes yet
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Create your first note to get started
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notes.slice(0, 10).map((note) => (
                            <motion.div
                              key={note.id}
                              className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleEditNote(note)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{note.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(note.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNote(note.id);
                                  }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                {/* Resize Handle */}
                <motion.div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={handleResizeMouseDown}
                  style={{
                    background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 35%, transparent 35%, transparent 65%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.1) 70%, transparent 70%)'
                  }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotesPopup;