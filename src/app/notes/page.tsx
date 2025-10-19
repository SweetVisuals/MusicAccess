"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useAudioPlayer, type Track } from "@/contexts/audio-player-context";
import { useFiles } from "@/hooks/useFiles";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Note, Project, SavedProject, NoteFile, DatabaseFile } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link, Unlink, Paperclip, FileText, Music, Play, Pause, Edit, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { NoteFileBrowser } from "@/components/notes/NoteFileBrowser"; // Import the new component
import { AccentProvider } from "@/contexts/accent-context";
import { RhymeHighlightProvider } from "@/contexts/rhyme-highlight-context";

// Import the new simple text editor
import { SimpleTextEditor } from '@/components/notes/SimpleTextEditor'

const NotesPage = () => {
  const { user } = useAuth();
  const { currentTrack, playTrack, isPlaying, progress, duration, seek } = useAudioPlayer(); // Destructure progress, duration, seek
  const { files: userFiles } = useFiles(user?.id || '');
  const [notes, setNotes] = useState<Note[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedProjectForNewNote, setSelectedProjectForNewNote] = useState<string | null>(null);
  const [selectedFilesForNewNote, setSelectedFilesForNewNote] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [editingNoteProject, setEditingNoteProject] = useState<string | null>(null);
  const [editingNoteFiles, setEditingNoteFiles] = useState<string[]>([]);
  // Editor is always loaded with our simple implementation
  const editorLoaded = true;

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchSavedProjects();
    }
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
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

    if (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes.",
        variant: "destructive",
      });
    } else {
      setNotes(data as Note[]);
    }
  };

  const fetchSavedProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects.",
        variant: "destructive",
      });
    } else {
      // Convert projects to saved projects format for compatibility
      const savedProjectsData = data.map(project => ({
        id: project.id,
        user_id: user.id,
        project_id: project.id,
        created_at: project.created_at,
        projects: project
      }));
      setSavedProjects(savedProjectsData as SavedProject[]);
    }
  };


  const handleCreateNote = async () => {
    if (!user || newNoteTitle.trim() === "") return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: newNoteTitle,
        content: newNoteContent,
        project_id: selectedProjectForNewNote,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
    } else {
      setNotes((prev) => [data as Note, ...prev]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedProjectForNewNote(null);
      toast({
        title: "Success",
        description: "Note created successfully!",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    } else {
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content || "");
    setEditingNoteProject(note.project_id || null);

    // Initialize editing files with existing attachments
    const existingFileIds = note.note_files?.map((nf: NoteFile) => nf.file_id) || [];
    setEditingNoteFiles(existingFileIds);
  };

  const handleUnlinkProject = async (noteId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .update({ project_id: null, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

        if (error) {
      console.error("Error unlinking project:", error);
      toast({
        title: "Error",
        description: "Failed to unlink project.",
        variant: "destructive",
      });
      return;
    }

    if (!data) {
      console.error("Note not found or access denied");
      toast({
        title: "Error",
        description: "Note not found or access denied.",
        variant: "destructive",
      });
      return;
    }
      setNotes((prev) => {
        if (data) {
          const updatedNote: Note = data;
          return prev.map((note) => (note.id === noteId ? updatedNote : note));
        }
        return prev;
      });
      toast({
        title: "Success",
        description: "Project unlinked successfully!",
      });
  };

  const handleFileToggle = (fileId: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditingNoteFiles(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFilesForNewNote(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    }
  };

  const handleCreateNoteWithFiles = async () => {
    if (!user || newNoteTitle.trim() === "") return;

    // Create the note first
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: newNoteTitle,
        content: newNoteContent,
        project_id: selectedProjectForNewNote,
      })
      .select("*")
      .maybeSingle();

    if (noteError) {
      console.error("Error creating note:", noteError);
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
      return;
    }

    // Attach files to the note if any are selected
    if (selectedFilesForNewNote.length > 0) {
      const fileAttachments = selectedFilesForNewNote.map(fileId => ({
        note_id: noteData.id,
        file_id: fileId,
        user_id: user.id,
      }));

      const { error: fileError } = await supabase
        .from("note_files")
        .insert(fileAttachments);

      if (fileError) {
        console.error("Error attaching files:", fileError);
        toast({
          title: "Warning",
          description: "Note created but failed to attach some files.",
          variant: "destructive",
        });
      }
    }

    // Refresh notes to get updated data with files
    await fetchNotes();

    // Reset form
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedProjectForNewNote(null);
    setSelectedFilesForNewNote([]);

    toast({
      title: "Success",
      description: "Note created successfully!",
    });
  };

  const handleUpdateNoteWithFiles = async () => {
    if (!user || !editingNoteId || editingNoteTitle.trim() === "") return;

    // Update the note
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .update({
        title: editingNoteTitle,
        content: editingNoteContent,
        project_id: editingNoteProject,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingNoteId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (noteError) {
      console.error("Error updating note:", noteError);
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
      return;
    }

    if (!noteData) {
      console.error("Note not found or access denied");
      toast({
        title: "Error",
        description: "Note not found or access denied.",
        variant: "destructive",
      });
      return;
    }

    // Update file attachments
    // First, remove existing attachments
    await supabase
      .from("note_files")
      .delete()
      .eq("note_id", editingNoteId)
      .eq("user_id", user.id);

    // Add new attachments
    if (editingNoteFiles.length > 0) {
      const fileAttachments = editingNoteFiles.map(fileId => ({
        note_id: editingNoteId,
        file_id: fileId,
        user_id: user.id,
      }));

      const { error: fileError } = await supabase
        .from("note_files")
        .insert(fileAttachments);

      if (fileError) {
        console.error("Error updating file attachments:", fileError);
        toast({
          title: "Warning",
          description: "Note updated but failed to update file attachments.",
          variant: "destructive",
        });
      }
    }

    // Refresh notes and reset editing state
    await fetchNotes();
    setEditingNoteId(null);
    setEditingNoteTitle("");
    setEditingNoteContent("");
    setEditingNoteProject(null);
    setEditingNoteFiles([]);

    toast({
      title: "Success",
      description: "Note updated successfully!",
    });
  };

  return (
    <AccentProvider>
      <RhymeHighlightProvider>
        <div className="@container/main flex flex-1 flex-col h-full animate-fade-in overflow-hidden">
          <div className="px-6 pt-6">
            {/* Page Header */}
            <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Notes & Lyrics
            </h2>
            <p className="text-muted-foreground">
              Write lyrics, capture ideas, and organize your musical thoughts with attached audio files.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Section Layout */}
      <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full flex-1">
          {/* Left Section - Text Editor */}
          <div className="pr-2 flex flex-col h-full">
            {/* Note Writing/Editing Card */}
            <Card className="animate-slide-up flex flex-col h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {editingNoteId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingNoteId ? 'Edit Note' : 'Write Note'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {editingNoteId ? 'Update your note and attachments' : 'Create a new note with attached files'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col min-h-0">
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2"> {/* This is the new scrollable container */}
                  <div className="space-y-2 shrink-0">
                    <label className="text-sm font-medium">Note Title</label>
                    <Input
                      placeholder="Enter note title..."
                      value={editingNoteId ? editingNoteTitle : newNoteTitle}
                      onChange={(e) => editingNoteId ? setEditingNoteTitle(e.target.value) : setNewNoteTitle(e.target.value)}
                      className="focus-visible:ring-primary animate-fade-in"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <label className="text-sm font-medium">Note Content</label>
                    <div className={`transition-all duration-500 ease-in-out flex-1 flex flex-col min-h-0 ${
                      editingNoteId ? 'animate-slide-up' : 'animate-fade-in'
                    }`}>
                      <SimpleTextEditor
                        value={editingNoteId ? editingNoteContent : newNoteContent}
                        onChange={(value: string) => {
                          if (editingNoteId) {
                            setEditingNoteContent(value);
                          } else {
                            setNewNoteContent(value);
                          }
                        }}
                        placeholder="Write your notes, lyrics, or musical ideas here..."
                      />
                    </div>
                  </div>

                  {/* Show selected files preview */}
                  {(editingNoteId ? editingNoteFiles.length > 0 : selectedFilesForNewNote.length > 0) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Attached Files ({editingNoteId ? editingNoteFiles.length : selectedFilesForNewNote.length})</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {(editingNoteId ? editingNoteFiles : selectedFilesForNewNote).map(fileId => {
                          const file = userFiles.find(f => f.id === fileId);
                          if (!file) return null;
                          return (
                            <div key={fileId} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                              {file.type === 'audio' || file.type?.startsWith?.('audio/') ? (
                                <Music className="h-4 w-4 text-green-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="flex-1 truncate">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileToggle(fileId, !!editingNoteId)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                {editingNoteId ? (
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" onClick={() => setEditingNoteId(null)} className="flex-1">
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button onClick={handleUpdateNoteWithFiles} className="flex-1 bg-primary hover:bg-primary/90">
                      <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateNoteWithFiles}
                    disabled={!newNoteTitle.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Note
                  </Button>
                )}
              </CardFooter>
            </Card>

            </div>

          {/* Right Section - Attach Files & Your Notes */}
          <div className="flex flex-col space-y-6 overflow-y-auto pl-2 sidebar-scrollbar">
            {/* File Browser for selection - expanded to full height */}
            <Card className="animate-slide-up">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Paperclip className="h-5 w-5" />
                  Attach Files
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select files to attach to your note
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <NoteFileBrowser
                  selectedFiles={editingNoteId ? editingNoteFiles : selectedFilesForNewNote}
                  onFileToggle={(fileId) => handleFileToggle(fileId, !!editingNoteId)}
                  onFileSelect={(file) => handleFileToggle(file.id, !!editingNoteId)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playTrack={playTrack}
                />
              </CardContent>
            </Card>
            {/* Your Notes */}
            <Card className="animate-slide-up flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Notes</CardTitle>
                <p className="text-sm text-muted-foreground">Click on a note to edit it</p>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-y-auto sidebar-scrollbar">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No notes yet. Create your first note above!</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <Card 
                      key={note.id} 
                      className={`animate-fade-in cursor-pointer transition-all duration-300 ease-in-out ${
                        editingNoteId === note.id 
                          ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                          : 'hover:shadow-md hover:border-border/50 border-border/20'
                      }`}
                      onClick={() => handleEditNote(note)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="truncate">{note.title}</span>
                          {editingNoteId === note.id && (
                            <Badge variant="secondary" className="ml-2 animate-pulse">
                              Editing
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                          {note.projects && (
                            <span className="ml-2 text-primary">• {note.projects.title}</span>
                          )}
                        </p>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div
                          className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: note.content || "No content" }}
                        />
                      </CardContent>
                      <div className="px-6 pb-3 flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {note.note_files?.map((nf: NoteFile) => {
                            if (!nf.files) return null;
                            const isAudio = nf.files.file_type?.startsWith?.('audio/');
                            const isCurrentTrack = currentTrack?.id === nf.files.id;

                            const handleFileAction = async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (!nf.files) return;

                              if (isAudio) {
                                // Generate a signed URL for the audio file
                              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                                .from('audio_files') // Files are stored in the 'audio_files' bucket
                                .createSignedUrl(nf.files.file_path, 3600); // URL valid for 1 hour

                                if (signedUrlError) {
                                  console.error("Error generating signed URL:", signedUrlError);
                                  toast({
                                    title: "Error",
                                    description: "Failed to play audio: Could not generate a secure link.",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                const track: Track = {
                                  id: nf.files.id,
                                  title: nf.files.name,
                                  duration: (nf.files as any).duration || 0, // Use actual duration if available
                                  audioUrl: signedUrlData.signedUrl, // Use the signed URL
                                  projectTitle: note.projects?.title,
                                  artist: note.projects?.profiles?.full_name,
                                  file_path: nf.files.file_path, // Pass file_path for potential future use
                                  noteId: note.id, // Pass the note ID
                                  attachedFiles: note.note_files?.map((nf: NoteFile) => nf.files).filter(Boolean) as DatabaseFile[], // Pass attached files
                                  attachedProject: note.projects || undefined, // Pass attached project
                                };
                                playTrack(track);
                              } else {
                                // For non-audio files, open in new tab or download
                                window.open(nf.files.file_url, '_blank');
                              }
                            };

                            return (
                              <div
                                key={nf.id}
                                className="flex items-center gap-1 p-1.5 border rounded-md text-xs cursor-pointer hover:bg-muted transition-colors"
                                onClick={handleFileAction}
                              >
                                {isAudio ? (
                                  isCurrentTrack && isPlaying ? (
                                    <Pause className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Play className="h-3 w-3 text-green-600" />
                                  )
                                ) : (
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="truncate max-w-[100px]">{nf.files.name}</span>
                              </div>
                            );
                          })}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
        </div>
      </RhymeHighlightProvider>
    </AccentProvider>
  );
};

  // Helper function to format time
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

export default NotesPage;
