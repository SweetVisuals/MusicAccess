'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { type Project, type Contract as BaseContract, type Note } from '@/lib/types'
import { ChevronRight, Search, File, Check, FileText, Download, Trash2, FileSignature, Plus, Edit, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { SimpleTextEditor } from '@/components/notes/SimpleTextEditor'

const genres = ['Other', 'Lo-Fi', 'Trap', 'House', 'R&B', 'Electronic', 'Drill']

const subGenres: Record<string, string[]> = {
  'Other': [
    'Experimental', 'Fusion', 'World', 'Classical', 'Jazz', 'Blues', 'Rock', 'Pop', 'Hip Hop',
    'Reggae', 'Funk', 'Soul', 'Gospel', 'Country', 'Folk', 'Indie', 'Alternative', 'Punk',
    'Metal', 'Electronic', 'Ambient', 'Soundtrack', 'Instrumental', 'Vocal', 'Acoustic',
    'Live', 'Remix', 'Cover', 'Original', 'Traditional'
  ],
  'Lo-Fi': [
    'Chill', 'Ambient', 'Study', 'Vaporwave', 'Jazz', 'Hip Hop', 'Instrumental', 'Dreamy',
    'Nostalgic', 'Relaxing', 'Melancholic', 'Smooth', 'Groovy', 'Retro', 'Soulful',
    'Tropical', 'Summer', 'Winter', 'Autumn', 'Spring', 'Night', 'Day', 'Morning', 'Evening',
    'Rainy', 'Sunny', 'Cloudy', 'Stormy', 'Peaceful', 'Calm'
  ],
  'Trap': [
    'Boom Bap', 'Southern', 'Atlanta', 'West Coast', 'East Coast', 'Hard', 'Melodic', 'Dark',
    'Heavy', 'Bass', '808s', 'Hi-Hats', 'Snappy', 'Aggressive', 'Intense', 'Trap Soul',
    'Trap Metal', 'Trap Rock', 'Trap Pop', 'Trap R&B', 'Trap Hip Hop', 'Trap Drill',
    'Trap House', 'Trap Electronic', 'Trap Lo-Fi'
  ],
  'House': [
    'Deep', 'Tech', 'Progressive', 'Minimal', 'Funky', 'Soulful', 'Chicago', 'Detroit', 'UK',
    'Italian', 'French', 'German', 'Dutch', 'Disco', 'Vocal', 'Garage', 'Speed', 'Hard',
    'Tropical', 'Future', 'Bass', 'Melodic', 'Organic', 'Synthetic', 'Analog', 'Digital'
  ],
  'R&B': [
    'Contemporary', 'Neo-Soul', 'Alternative', 'Pop', 'Hip Hop', 'Soul', 'Funk', 'Gospel',
    'Jazz', 'Blues', 'Reggae', 'Afrobeat', 'Smooth', 'Urban', 'Modern', 'Classic', 'Vintage',
    'Motown', 'Stax', 'Atlantic', 'Contemporary Christian', 'Gospel Hip Hop', 'Soul Jazz',
    'Funk Soul', 'Blue-Eyed Soul', 'White Soul'
  ],
  'Electronic': [
    'EDM', 'Techno', 'Trance', 'Dubstep', 'Drum and Bass', 'Ambient', 'Experimental', 'IDM',
    'Glitch', 'Noise', 'Synthwave', 'Vaporwave', 'Chillout', 'Psychedelic', 'Industrial',
    'Electro', 'Synth Pop', 'New Wave', 'Dark Wave', 'EBM', 'Future Bass', 'Trap',
    'Lo-Fi Hip Hop', 'Vapor Trap', 'Wave'
  ],
  'Drill': [
    'UK', 'Chicago', 'New York', 'Brooklyn', 'Harlem', 'South Side', 'West Side', 'East Side',
    'Dark', 'Melodic', 'Trap-influenced', 'Heavy', 'Aggressive', 'Raw', 'Street', 'Gangsta',
    'Horrorcore', 'Horror', 'Dark Trap', 'Drill Trap', 'Drill House', 'Drill Electronic',
    'Drill Lo-Fi', 'Drill Hip Hop', 'Drill R&B'
  ]
}

interface Contract extends BaseContract {
  isSelected: boolean
  isCurrentlyAttached?: boolean
}

interface StudioProjectEditDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectUpdated: () => void
}

const StudioProjectEditDialog = ({ project, open, onOpenChange, onProjectUpdated }: StudioProjectEditDialogProps) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: project.title || '',
    description: project.description || '',
    genre: project.genre || '',
    sub_genre: (project.sub_genre as string[]) || [],
  })

  // State for notes
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')

  // State for contracts
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [attachedContracts, setAttachedContracts] = useState<Contract[]>([])
  const [contractFile, setContractFile] = useState<File | null>(null)

  // Reset form data when project changes
  useEffect(() => {
    setFormData({
      title: project.title || '',
      description: project.description || '',
      genre: project.genre || '',
      sub_genre: (project.sub_genre as string[]) || [],
    })
  }, [project])

  // Fetch user's notes
  const fetchUserNotes = async () => {
    if (!user?.id) return

    setLoadingNotes(true)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Error fetching user notes:', err)
      toast.error('Error fetching your notes')
    } finally {
      setLoadingNotes(false)
    }
  }

  // Fetch user's contracts
  const fetchUserContracts = async () => {
    if (!user?.id) return

    setLoadingContracts(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add isSelected property to each contract
      const contractsWithSelection = (data || []).map(contract => ({
        ...contract,
        isSelected: false,
        isCurrentlyAttached: false
      }))

      setContracts(contractsWithSelection)
    } catch (err) {
      console.error('Error fetching user contracts:', err)
      toast.error('Error fetching your contracts')
    } finally {
      setLoadingContracts(false)
    }
  }

  // Fetch currently attached contracts for this project
  const fetchAttachedContracts = async () => {
    if (!project.id) return

    try {
      const { data, error } = await supabase
        .from('project_contracts')
        .select(`
          *,
          contracts (*)
        `)
        .eq('project_id', project.id)

      if (error) throw error

      const attachedContractsData = (data || []).map((pc: any) => pc.contracts).filter(Boolean)
      setAttachedContracts(attachedContractsData)

      // Update the contracts list to mark currently attached ones
      setContracts(prev => prev.map(contract => ({
        ...contract,
        isCurrentlyAttached: attachedContractsData.some(attached => attached.id === contract.id)
      })))
    } catch (error) {
      console.error('Error fetching attached contracts:', error)
    }
  }

  // Initialize data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      fetchUserNotes()
      fetchUserContracts()
      fetchAttachedContracts()
    }
  }, [open, user?.id, project.id])

  // Reset selected note and form when dialog is opened
  useEffect(() => {
    if (open) {
      setSelectedNote(null)
      setIsCreatingNote(false)
      setNewNoteTitle('')
      setNewNoteContent('')
      setContractFile(null)
    }
  }, [open])

  const handleUpdateProject = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title for your project")
      return
    }

    setIsSubmitting(true)

    try {
      // Update project basic info
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        genre: formData.genre || null,
        sub_genre: formData.sub_genre.length > 0 ? formData.sub_genre : null,
      }

      const { error: projectError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)

      if (projectError) throw projectError

      // Handle contract changes
      const selectedContracts = contracts.filter(contract => contract.isSelected)
      const contractsToAttach = selectedContracts.filter(contract =>
        !attachedContracts.some(attached => attached.id === contract.id)
      )
      const contractsToDetach = attachedContracts.filter(attachedContract =>
        !selectedContracts.some(contract => contract.id === attachedContract.id)
      )

      // Attach new contracts
      if (contractsToAttach.length > 0) {
        const contractAttachments = contractsToAttach.map(contract => ({
          project_id: project.id,
          contract_id: contract.id,
          user_id: user?.id
        }))

        const { error: attachError } = await supabase
          .from('project_contracts')
          .insert(contractAttachments)

        if (attachError) {
          console.error('Error attaching contracts:', attachError)
          toast.warning('Project updated but failed to attach some contracts')
        }
      }

      // Detach removed contracts
      if (contractsToDetach.length > 0) {
        for (const contract of contractsToDetach) {
          const { error: detachError } = await supabase
            .from('project_contracts')
            .delete()
            .eq('project_id', project.id)
            .eq('contract_id', contract.id)

          if (detachError) {
            console.error('Error detaching contract:', detachError)
            toast.warning('Project updated but failed to detach some contracts')
          }
        }
      }

      // Handle contract file upload (legacy support)
      if (contractFile) {
        const contractFileName = `${user?.id}/${project.id}/${contractFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(contractFileName, contractFile)

        if (uploadError) {
          console.error('Error uploading contract:', uploadError)
          toast.error('Failed to upload contract.')
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(contractFileName)
          const contractUrl = publicUrlData?.publicUrl

          if (contractUrl) {
            await supabase
              .from('projects')
              .update({ contract_url: contractUrl })
              .eq('id', project.id)
          }
        }
      }

      toast.success("Project updated successfully!")
      onOpenChange(false)
      onProjectUpdated()
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error("Failed to update project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error("Please enter both title and content for the note")
      return
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: newNoteTitle,
          content: newNoteContent,
          user_id: user?.id,
          project_id: project.id
        }])
        .select()
        .single()

      if (error) throw error

      toast.success("Note created successfully!")
      setNewNoteTitle('')
      setNewNoteContent('')
      setIsCreatingNote(false)
      fetchUserNotes()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error("Failed to create note")
    }
  }

  const handleUpdateNote = async () => {
    if (!selectedNote || !selectedNote.title.trim() || !(selectedNote.content || '').trim()) {
      toast.error("Please enter both title and content for the note")
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: selectedNote.title,
          content: selectedNote.content
        })
        .eq('id', selectedNote.id)

      if (error) throw error

      toast.success("Note updated successfully!")
      setSelectedNote(null)
      fetchUserNotes()
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error("Failed to update note")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      toast.success("Note deleted successfully!")
      fetchUserNotes()
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error("Failed to delete note")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Studio Project</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a title for your project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your project"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-genre">Genre</Label>
              <Select value={formData.genre} onValueChange={(value) => {
                setFormData({...formData, genre: value, sub_genre: []})
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-genre selection */}
            <div className="space-y-2">
              <Label>Sub-Genres (select multiple)</Label>
              {formData.genre ? (
                <ScrollArea className="h-32 border rounded p-2">
                  <div className="space-y-2">
                    {subGenres[formData.genre]?.map(sub => (
                      <div key={sub} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`sub-${sub}`}
                          checked={formData.sub_genre.includes(sub)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, sub_genre: [...formData.sub_genre, sub]})
                            } else {
                              setFormData({...formData, sub_genre: formData.sub_genre.filter(s => s !== sub)})
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`sub-${sub}`} className="text-sm font-normal cursor-pointer">
                          {sub}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">Select a genre first</p>
              )}

              {/* Selected Sub-Genres Display */}
              {formData.sub_genre.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm">Selected Sub-Genres:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.sub_genre.map(sub => (
                      <Badge key={sub} variant="secondary" className="text-xs">
                        {sub}
                        <button
                          onClick={() => setFormData({...formData, sub_genre: formData.sub_genre.filter(s => s !== sub)})}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <ScrollArea className="h-[500px] border rounded-lg shadow-sm bg-card p-4">
              {loadingNotes ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-opacity-20"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">Loading your notes...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Create New Note Button */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Project Notes</h3>
                    <Button
                      onClick={() => setIsCreatingNote(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Note
                    </Button>
                  </div>

                  {/* Create Note Form */}
                  {isCreatingNote && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Create New Note</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCreatingNote(false)
                            setNewNoteTitle('')
                            setNewNoteContent('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note-title">Note Title</Label>
                        <Input
                          id="note-title"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          placeholder="Enter note title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Note Content</Label>
                        <div className="h-48">
                          <SimpleTextEditor
                            value={newNoteContent}
                            onChange={setNewNoteContent}
                            placeholder="Write your note content here..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingNote(false)
                            setNewNoteTitle('')
                            setNewNoteContent('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateNote}>
                          Create Note
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Edit Note Form */}
                  {selectedNote && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Edit Note</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNote(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-note-title">Note Title</Label>
                        <Input
                          id="edit-note-title"
                          value={selectedNote.title}
                          onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})}
                          placeholder="Enter note title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Note Content</Label>
                        <div className="h-48">
                          <SimpleTextEditor
                            value={selectedNote.content || ''}
                            onChange={(content) => setSelectedNote({...selectedNote, content})}
                            placeholder="Write your note content here..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedNote(null)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateNote}>
                          Update Note
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm">No notes found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create your first note for this project
                        </p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{note.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {(note.content || '').replace(/<[^>]*>/g, '')}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Created: {new Date(note.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedNote(note)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <ScrollArea className="h-[500px] border rounded-lg shadow-sm bg-card p-4">
              {loadingContracts ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-opacity-20"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">Loading your contracts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Currently Attached Contracts */}
                  {attachedContracts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Currently Attached Contracts</Label>
                      <div className="space-y-2">
                        {attachedContracts.map((contract) => (
                          <div
                            key={`attached-${contract.id}`}
                            className="border rounded-lg p-3 bg-green-50/50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileSignature className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm">{contract.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {contract.type}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-red-500 hover:text-red-600"
                                onClick={() => {
                                  setContracts(prev => prev.map(c =>
                                    c.id === contract.id
                                      ? { ...c, isSelected: false, isCurrentlyAttached: false }
                                      : c
                                  ))
                                  setAttachedContracts(prev => prev.filter(c => c.id !== contract.id))
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select Existing Contracts */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Existing Contracts</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose from your existing contracts to attach to this project
                    </p>
                  </div>

                  {contracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm">No contracts found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create contracts in the Contracts page first
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {contracts
                        .filter(contract => !contract.isCurrentlyAttached)
                        .map((contract) => {
                          const isSelected = contract.isSelected
                          return (
                            <div
                              key={contract.id}
                              className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer flex items-start gap-3 ${isSelected ? 'bg-primary/5 border-primary shadow-md' : 'hover:bg-muted/50'}`}
                              onClick={() => {
                                setContracts(prev => prev.map(c =>
                                  c.id === contract.id
                                    ? { ...c, isSelected: !c.isSelected }
                                    : c
                                ))
                              }}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium truncate text-sm">{contract.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {contract.type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      contract.status === 'active' ? 'border-green-500 text-green-500' :
                                      contract.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                                      contract.status === 'expired' ? 'border-red-500 text-red-500' :
                                      'border-gray-500 text-gray-500'
                                    }`}
                                  >
                                    {contract.status}
                                  </Badge>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Created: {new Date(contract.created_at).toLocaleDateString()}</div>
                                  {contract.expires_at && (
                                    <div>Expires: {new Date(contract.expires_at).toLocaleDateString()}</div>
                                  )}
                                  {contract.royalty_split && (
                                    <div>Royalty Split: {contract.royalty_split}%</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Upload New Contract */}
                  <div className="border-t pt-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-contract">Or Upload New Contract</Label>
                      <Input
                        id="edit-contract"
                        type="file"
                        onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)}
                        accept=".pdf,.doc,.docx"
                      />
                      {contractFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {contractFile.name}
                        </p>
                      )}
                      {project.contract_url && !contractFile && (
                        <p className="text-sm text-muted-foreground">
                          Current contract: {project.contract_url.split('/').pop()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateProject} disabled={isSubmitting || !formData.title.trim()}>
            {isSubmitting ? 'Updating...' : 'Update Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StudioProjectEditDialog