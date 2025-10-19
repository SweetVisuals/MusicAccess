'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Music,
  Package,
  FileText,
  Upload,
  X,
  Check,
  FolderOpen
} from 'lucide-react'
import { type Project } from '@/lib/types'

interface StudioProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onProjectSaved: () => void
  projectToEdit?: Project | null
  purchasedFiles?: any[]
}

export default function StudioProjectDialog({
  isOpen,
  onClose,
  onProjectSaved,
  projectToEdit,
  purchasedFiles = []
}: StudioProjectDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState<'studio' | 'soundpack'>('studio')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title)
      setDescription(projectToEdit.description || '')
      setProjectType(projectToEdit.tags?.includes('soundpack') ? 'soundpack' : 'studio')
      setTags(projectToEdit.tags || [])
      setCoverImagePreview(projectToEdit.cover_image_url || '')
    } else {
      resetForm()
    }
  }, [projectToEdit, isOpen])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setProjectType('studio')
    setSelectedFiles([])
    setCoverImage(null)
    setCoverImagePreview('')
    setTags([])
    setNewTag('')
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImage || !user) return null

    try {
      const fileExt = coverImage.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('project_covers')
        .upload(fileName, coverImage)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('project_covers')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading cover image:', error)
      toast.error('Failed to upload cover image')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setIsLoading(true)

    try {
      let coverImageUrl = projectToEdit?.cover_image_url || ''

      // Upload new cover image if provided
      if (coverImage) {
        const uploadedUrl = await uploadCoverImage()
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl
        }
      }

      const projectData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl || null,
        tags: [...tags, projectType],
        visibility: 'private',
        genre: '',
        sub_genre: [],
        price: 0,
        allow_downloads: false
      }

      if (projectToEdit) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectToEdit.id)
          .eq('user_id', user.id)

        if (error) throw error

        toast.success('Project updated successfully')
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single()

        if (error) throw error

        // Add selected files to project
        if (selectedFiles.length > 0 && data) {
          const projectFiles = selectedFiles.map(fileId => ({
            project_id: data.id,
            file_id: fileId,
            user_id: user.id
          }))

          const { error: filesError } = await supabase
            .from('project_files')
            .insert(projectFiles)

          if (filesError) {
            console.error('Error adding files to project:', filesError)
            toast.warning('Project created but some files could not be added')
          }
        }

        toast.success('Project created successfully')
      }

      resetForm()
      onProjectSaved()
      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(`Failed to ${projectToEdit ? 'update' : 'create'} project`)
    } finally {
      setIsLoading(false)
    }
  }

  const availableFiles = [
    ...purchasedFiles,
    // Add user's own files here if needed
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Type */}
          <div className="space-y-2">
            <Label>Project Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProjectType('studio')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  projectType === 'studio'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    projectType === 'studio' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Studio Project</div>
                    <div className="text-sm text-muted-foreground">
                      For music production and collaboration
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setProjectType('soundpack')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  projectType === 'soundpack'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    projectType === 'soundpack' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Soundpack</div>
                    <div className="text-sm text-muted-foreground">
                      Collection of sounds and samples
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={3}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {coverImagePreview ? (
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1:1 aspect ratio, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Purchased Files */}
          {availableFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Add Purchased Files</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {availableFiles.map((file, index) => (
                  <div
                    key={`${file.id}-${index}`}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleFileToggle(file.id)}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selectedFiles.includes(file.id)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border'
                    }`}>
                      {selectedFiles.includes(file.id) && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {file.item_title || 'Purchased File'} • {file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} of {availableFiles.length} files selected
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onClose()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
                  {projectToEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                projectToEdit ? 'Update Project' : 'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
