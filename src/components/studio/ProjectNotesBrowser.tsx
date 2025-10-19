'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Note, Project } from '@/lib/types'
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
  Pause
} from 'lucide-react'
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context'

interface ProjectNotesBrowserProps {
  project: Project | null
  onNoteCreated?: () => void
  onNoteUpdated?: () => void
  onNoteDeleted?: () => void
}

export function ProjectNotesBrowser({ 
  project, 
  onNoteCreated, 
  onNoteUpdated, 
  onNoteDeleted 
}: ProjectNotesBrowserProps) {
  const { user } = useAuth()
  const { currentTrack, playTrack, isPlaying } = useAudioPlayer()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteTitle, setEditingNoteTitle] = useState('')
  const [editingNoteContent, setEditingNoteContent] = useState('')

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
          )
        `)
        .eq('user_id', user.id)
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

      setNotes(prev => [data, ...prev])
      setNewNoteTitle('')
      setNewNoteContent('')
      setShowCreateForm(false)
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

  const handleEditNote = (note: Note) => {
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

  if (!project) {
    return (
      <div className="w-80 border-l bg-muted/20 p-4">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a project to view notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-muted/20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Project Notes</h3>
            <p className="text-sm text-muted-foreground truncate">
              {project.title}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Note Form */}
        {showCreateForm && (
          <Card className="animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create New Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Note title..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="text-sm"
              />
              <textarea
                placeholder="Note content..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full min-h-[80px] p-2 border rounded-md text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  disabled={!newNoteTitle.trim()}
                  className="flex-1"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet for this project</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  {editingNoteId === note.id ? (
                    <Input
                      value={editingNoteTitle}
                      onChange={(e) => setEditingNoteTitle(e.target.value)}
                      className="text-sm mb-2"
                    />
                  ) : (
                    <CardTitle className="text-sm">{note.title}</CardTitle>
                  )}
                  <div className="flex gap-1">
                    {editingNoteId === note.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUpdateNote}
                          className="h-6 w-6"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditNote(note)}
                          className="h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="pb-3">
                {editingNoteId === note.id ? (
                  <textarea
                    value={editingNoteContent}
                    onChange={(e) => setEditingNoteContent(e.target.value)}
                    className="w-full min-h-[60px] p-2 border rounded-md text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content || 'No content'}
                  </p>
                )}

                {/* Attached Files */}
                {note.note_files && note.note_files.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Attached files:</p>
                    {note.note_files.map((nf) => {
                      if (!nf.files) return null
                      const isAudio = nf.files.file_type?.startsWith('audio/')
                      const isCurrentTrack = currentTrack?.id === nf.files.id

                      return (
                        <div
                          key={nf.id}
                          className="flex items-center gap-2 p-1.5 text-xs border rounded cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => isAudio && handlePlayAudioFile(nf.files)}
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
                          <span className="truncate flex-1">{nf.files.name}</span>
                          {isAudio && (
                            <Badge variant="outline" className="text-[10px]">
                              Audio
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
