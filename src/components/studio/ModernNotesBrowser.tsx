'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { NoteWithProfile, Project, DatabaseFile } from '@/lib/types'
import { toast } from 'sonner'
import { Button } from '@/components/@/ui/button'
import { Input } from '@/components/@/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/@/ui/card'
import { Badge } from '@/components/@/ui/badge'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Music,
  Play,
  Pause,
  Paperclip,
  Search,
  Filter,
  Pin,
  Clock,
  User
} from 'lucide-react'
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context'
import { NoteFileBrowser } from '@/components/notes/NoteFileBrowser'
import { formatDateRelative } from '@/lib/utils'

interface ModernNotesBrowserProps {
  project: Project | null
  onNoteCreated?: () => void
  onNoteUpdated?: () => void
  onNoteDeleted?: () => void
}

export function ModernNotesBrowser({ 
  project, 
  onNoteCreated, 
  onNoteUpdated, 
  onNoteDeleted 
}: ModernNotesBrowserProps) {
  const { user } = useAuth()
  const { currentTrack, playTrack, isPlaying } = useAudioPlayer()
  const [notes, setNotes] = useState<NoteWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteTitle, setEditingNoteTitle] = useState('')
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  useEffect(() => {
    if (project) {
      fetchProjectNotes()
    } else {
      setNotes([])
    }
  }, [project])

  const fetchProjectNotes = async () => {
    if (!user || !project) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_files(
            id,
            file_id,
            files(*)
          ),
          profiles:user_id(full_name, avatar_url, username)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching project notes:', error)
      toast.error('Failed to load project notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!user || !project || !newNoteTitle.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          project_id: project.id,
          title: newNoteTitle,
          content: newNoteContent,
        })
        .select('*')
        .single()

      if (error) throw error

      // Attach selected files to the note
      if (selectedFiles.length > 0) {
        const noteFiles = selectedFiles.map(fileId => ({
          note_id: data.id,
          file_id: fileId,
          user_id: user.id
        }))

        const { error: noteFilesError } = await supabase
          .from('note_files')
          .insert(noteFiles)

        if (noteFilesError) {
          console.error('Error attaching files:', noteFilesError)
        }
      }

      setNotes(prev => [data, ...prev])
      setNewNoteTitle('')
      setNewNoteContent('')
      setSelectedFiles([])
      setShowCreateForm(false)
      setShowFileBrowser(false)
      toast.success('Note created successfully')
      onNoteCreated?.()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    }
  }

  const handleUpdateNote = async () => {
    if (!user || !editingNoteId || !editingNoteTitle.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: editingNoteTitle,
          content: editingNoteContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNoteId)
        .eq('user_id', user.id)
        .select('*')
        .single()

      if (error) throw error

      setNotes(prev => prev.map(note => 
        note.id === editingNoteId ? data : note
      ))
      setEditingNoteId(null)
      setEditingNoteTitle('')
      setEditingNoteContent('')
      toast.success('Note updated successfully')
      onNoteUpdated?.()
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) throw error

      setNotes(prev => prev.filter(note => note.id !== noteId))
      toast.success('Note deleted successfully')
      onNoteDeleted?.()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const handleEditNote = (note: NoteWithProfile) => {
    setEditingNoteId(note.id)
    setEditingNoteTitle(note.title)
    setEditingNoteContent(note.content || '')
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingNoteTitle('')
    setEditingNoteContent('')
  }

  const handlePlayAudioFile = async (file: any) => {
    if (!file.file_type?.startsWith('audio/')) return

    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('audio_files')
        .createSignedUrl(file.file_path, 3600)

      if (signedUrlError) throw signedUrlError

      const track: Track = {
        id: file.id,
        title: file.name,
        duration: file.duration || 0,
        audioUrl: signedUrlData.signedUrl,
        file_path: file.file_path,
      }

      playTrack(track)
    } catch (error) {
      console.error('Error playing audio:', error)
      toast.error('Failed to play audio file')
    }
  }

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleFileSelect = (file: DatabaseFile) => {
    handleFileToggle(file.id)
  }

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!project) {
    return (
      <div className="flex-1 bg-background border-l border-border/40 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-20 w-20 mx-auto mb-5 opacity-50" />
            <p className="text-xl font-medium mb-2">Select a project to view notes</p>
            <p className="text-sm">Choose a project from the sidebar to start taking notes</p>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="flex-1 bg-background border-l border-border/40 flex flex-col">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Project Notes</h2>
              <p className="text-muted-foreground mt-1">{project.title}</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 h-10 px-4"
            >
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Notes List */}
        <div className="w-96 border-r border-border/30 overflow-y-auto">
          <div className="p-6 space-y-5">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-14 w-14 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No notes found</p>
                {searchQuery && (
                  <p className="text-sm mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card 
                  key={note.id} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in border-border/40 hover:border-primary/30 hover:scale-[1.01]"
                  onClick={() => handleEditNote(note)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-base line-clamp-2 text-foreground leading-tight">
                        {note.title}
                      </h3>
                      {note.note_files && note.note_files.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {note.note_files.length}
                        </Badge>
                      )}
                    </div>
                    
                    {note.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                        {note.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        {note.profiles?.avatarUrl ? (
                          <img 
                            src={note.profiles.avatarUrl} 
                            alt={note.profiles.full_name || 'User'}
                            className="h-5 w-5 rounded-full border"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="font-medium text-xs">{note.profiles?.full_name || 'Unknown'}</span>
                      </div>
                      <span className="text-xs opacity-80">{formatDateRelative(note.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Note Editor / Create Form */}
        <div className="flex-1 overflow-y-auto">
          {showCreateForm ? (
            <div className="p-8">
              <Card className="border-border/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Create New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    placeholder="Note title..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="h-12 text-base"
                  />
                  <textarea
                    placeholder="Write your note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full min-h-[160px] p-4 border border-input rounded-md resize-none text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  
                  {/* File Attachments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attachments</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFileBrowser(!showFileBrowser)}
                        className="h-9 px-3"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {showFileBrowser ? 'Hide Files' : 'Attach Files'}
                      </Button>
                    </div>

                    {showFileBrowser && (
                      <div className="border border-border/30 rounded-md p-4">
                        <NoteFileBrowser
                          selectedFiles={selectedFiles}
                          onFileToggle={handleFileToggle}
                          onFileSelect={handleFileSelect}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          playTrack={playTrack}
                        />
                      </div>
                    )}

                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map(fileId => (
                          <Badge key={fileId} variant="secondary" className="text-xs px-2 py-1">
                            File #{fileId.slice(0, 6)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        setSelectedFiles([])
                        setShowFileBrowser(false)
                      }}
                      className="flex-1 h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateNote}
                      disabled={!newNoteTitle.trim()}
                      className="flex-1 h-11"
                    >
                      Create Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : editingNoteId ? (
            <div className="p-8">
              <Card className="border-border/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Edit Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    value={editingNoteTitle}
                    onChange={(e) => setEditingNoteTitle(e.target.value)}
                    className="h-12 text-base"
                  />
                  <textarea
                    value={editingNoteContent}
                    onChange={(e) => setEditingNoteContent(e.target.value)}
                    className="w-full min-h-[160px] p-4 border border-input rounded-md resize-none text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateNote}
                      disabled={!editingNoteTitle.trim()}
                      className="flex-1 h-11"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-20 w-20 mx-auto mb-5 opacity-50" />
                <p className="text-xl font-medium mb-2">Select a note to view</p>
                <p className="text-sm">Choose a note from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
