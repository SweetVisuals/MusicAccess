'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  User
} from 'lucide-react'
import { type Project, type Note } from '@/lib/types'
import { formatDateRelative } from '@/lib/utils'

interface FinderNotesPanelProps {
  project: Project
  onNoteCreated?: () => void
  onNoteUpdated?: () => void
  onNoteDeleted?: () => void
}

export function FinderNotesPanel({ project, onNoteCreated, onNoteUpdated, onNoteDeleted }: FinderNotesPanelProps) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')

  useEffect(() => {
    if (project?.id) {
      fetchNotes()
    }
  }, [project?.id])

  const fetchNotes = async () => {
    if (!user || !project?.id) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!user || !project?.id || !newNoteTitle.trim()) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          project_id: project.id,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Note created successfully')
      setNotes(prev => [data, ...prev])
      setNewNoteTitle('')
      setNewNoteContent('')
      setShowCreateForm(false)
      onNoteCreated?.()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    }
  }

  const handleUpdateNote = async () => {
    if (!user || !editingNote || !newNoteTitle.trim()) return

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Note updated successfully')
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, title: newNoteTitle.trim(), content: newNoteContent.trim() || null }
          : note
      ))
      setEditingNote(null)
      setNewNoteTitle('')
      setNewNoteContent('')
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

      toast.success('Note deleted successfully')
      setNotes(prev => prev.filter(note => note.id !== noteId))
      onNoteDeleted?.()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const startEditing = (note: Note) => {
    setEditingNote(note)
    setNewNoteTitle(note.title)
    setNewNoteContent(note.content || '')
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setNewNoteTitle('')
    setNewNoteContent('')
    setShowCreateForm(false)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Notes</h3>
            <Badge variant="secondary">{notes.length}</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowCreateForm(true)
              setEditingNote(null)
              setNewNoteTitle('')
              setNewNoteContent('')
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingNote) && (
        <div className="p-4 border-b bg-muted/20">
          <div className="space-y-3">
            <Input
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Note content..."
              value={newNoteContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNoteContent(e.target.value)}
              rows={4}
              className="text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                disabled={!newNoteTitle.trim()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingNote ? 'Update' : 'Create'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Create your first note to get started</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="group hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingNote?.id === note.id ? (
                      <Input
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="text-sm font-semibold mb-2"
                      />
                    ) : (
                      <CardTitle className="text-sm font-semibold line-clamp-1">
                        {note.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateRelative(note.created_at)}</span>
                      {note.updated_at !== note.created_at && (
                        <>
                          <span>•</span>
                          <span>Edited {formatDateRelative(note.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingNote?.id !== note.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(note)}
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
              </CardHeader>
              <CardContent className="pt-0">
                {editingNote?.id === note.id ? (
                  <Textarea
                    value={newNoteContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNoteContent(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content || 'No content'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
