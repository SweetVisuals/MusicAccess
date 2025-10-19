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
  Paperclip
} from 'lucide-react'

// Rich Text Editor Imports with error handling
import RichTextEditor, {
  BaseKit,
} from 'reactjs-tiptap-editor';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Code } from 'reactjs-tiptap-editor/code';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { History } from 'reactjs-tiptap-editor/history';
import { Link as TiptapLink } from 'reactjs-tiptap-editor/link';
import { Color } from 'reactjs-tiptap-editor/color';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { LineHeight } from 'reactjs-tiptap-editor/lineheight';
// External CSS import removed to prevent white background issues
// import 'reactjs-tiptap-editor/style.css';

// Error boundary and fallback
import { RichTextEditorErrorBoundary, SimpleTextareaFallback } from '../notes/RichTextEditorErrorBoundary'

interface MinimalNotesBrowserProps {
  project: Project | null
  onNoteCreated?: () => void
  onNoteUpdated?: () => void
  onNoteDeleted?: () => void
}

export function MinimalNotesBrowser({ 
  project, 
  onNoteCreated, 
  onNoteUpdated, 
  onNoteDeleted 
}: MinimalNotesBrowserProps) {
  const { user } = useAuth()
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
        .select('*')
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

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a project to view notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Notes</h3>
            <p className="text-xs text-muted-foreground truncate">
              {project.title}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Create Note Form */}
        {showCreateForm && (
          <Card className="animate-slide-up">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs">New Note</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              <Input
                placeholder="Note title..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="text-xs h-7"
              />
              <div className="min-h-[80px] border rounded-md overflow-hidden">
                <RichTextEditorErrorBoundary
                  fallback={
                    <SimpleTextareaFallback
                      value={newNoteContent}
                      onChange={setNewNoteContent}
                      placeholder="Write your note here..."
                      className="min-h-[80px]"
                    />
                  }
                >
                  <RichTextEditor
                    output='html'
                    content={newNoteContent}
                    onChangeContent={setNewNoteContent}
                    extensions={[
                      BaseKit.configure({
                        placeholder: {
                          showOnlyCurrent: true,
                          placeholder: "Write your note here...",
                        },
                        characterCount: {
                          limit: 5000,
                        },
                      }),
                      Bold,
                      Italic,
                      TextUnderline,
                      Strike,
                      Code,
                      BulletList,
                      OrderedList,
                      Blockquote,
                      History,
                      TiptapLink,
                    ]}
                    contentClass="text-xs p-2 min-h-[80px] prose prose-sm max-w-none focus:outline-none"
                  />
                </RichTextEditorErrorBoundary>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-6 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  disabled={!newNoteTitle.trim()}
                  className="flex-1 h-6 text-xs"
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
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-1">Loading...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="animate-fade-in">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-start justify-between">
                  {editingNoteId === note.id ? (
                    <Input
                      value={editingNoteTitle}
                      onChange={(e) => setEditingNoteTitle(e.target.value)}
                      className="text-xs h-6 mb-1"
                    />
                  ) : (
                    <CardTitle className="text-xs cursor-pointer" onClick={() => handleEditNote(note)}>
                      {note.title}
                    </CardTitle>
                  )}
                  <div className="flex gap-0.5">
                    {editingNoteId === note.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-5 w-5"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUpdateNote}
                          className="h-5 w-5"
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
                          className="h-5 w-5"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-5 w-5 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {editingNoteId === note.id ? (
                  <div className="min-h-[60px] border rounded-md overflow-hidden">
                    <RichTextEditorErrorBoundary
                      fallback={
                        <SimpleTextareaFallback
                          value={editingNoteContent}
                          onChange={setEditingNoteContent}
                          placeholder="Write your note here..."
                          className="min-h-[60px]"
                        />
                      }
                    >
                      <RichTextEditor
                        output='html'
                        content={editingNoteContent}
                        onChangeContent={setEditingNoteContent}
                        extensions={[
                          BaseKit.configure({
                            placeholder: {
                              showOnlyCurrent: true,
                              placeholder: "Write your note here...",
                            },
                            characterCount: {
                              limit: 5000,
                            },
                          }),
                          Bold,
                          Italic,
                          TextUnderline,
                          Strike,
                          Code,
                          BulletList,
                          OrderedList,
                          Blockquote,
                          History,
                          TiptapLink,
                        ]}
                        contentClass="text-xs p-2 min-h-[60px]"
                      />
                    </RichTextEditorErrorBoundary>
                  </div>
                ) : (
                  <div 
                    className="text-xs text-muted-foreground line-clamp-3 cursor-pointer"
                    onClick={() => handleEditNote(note)}
                    dangerouslySetInnerHTML={{ __html: note.content || 'No content' }}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
