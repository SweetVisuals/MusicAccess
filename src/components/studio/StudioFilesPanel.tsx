'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import { File, Folder, Trash2, Upload, Package, Download, FolderOpen, FolderPlus, MoreVertical, ChevronRight, ChevronDown, Pencil, Star, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorage } from '@/contexts/storage-context'
import { supabase } from '@/lib/supabase'
import { type FileItem } from '@/lib/types'

interface StudioFilesPanelProps {
  project?: any
  purchasedFiles?: any[]
  onFilesUpdated?: () => void
}

interface FolderItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  user_id: string
  parent_id?: string
  file_count?: number
  starred?: boolean
}

export function StudioFilesPanel({ project, purchasedFiles = [], onFilesUpdated }: StudioFilesPanelProps) {
  const [isDragOverlay, setIsDragOverlay] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { triggerStorageUpdate } = useStorage()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderStack, setFolderStack] = useState<FolderItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<'my-files' | 'purchased'>('my-files')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [draggedFile, setDraggedFile] = useState<string | null>(null)
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [dragCounter, setDragCounter] = useState(0)
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renamingFile, setRenamingFile] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const fileItems: FileItem[] = data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.file_type || 'file',
        size: formatBytes(file.size || 0),
        modified: new Date(file.updated_at || file.created_at).toISOString().split('T')[0],
        audio_url: file.file_url,
        file_path: file.file_path,
        folder_id: file.folder_id,
        starred: file.starred || false
      }))

      setFiles(fileItems)
    } catch (error: any) {
      toast({
        title: 'Error loading files',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user?.id)
        .is('parent_id', null) // Only top-level folders for now
        .order('created_at', { ascending: false })

      if (error) throw error

      setFolders(data || [])
    } catch (error: any) {
      toast({
        title: 'Error loading folders',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleUpload = async (acceptedFiles: File[], targetFolderId?: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)

    try {
      for (const file of acceptedFiles) {
        const fileId = crypto.randomUUID()
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${fileId}.${fileExt}`

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath)

        // Add file record to database
        const { error: dbError } = await supabase
          .from('files')
          .insert([{
            id: fileId,
            name: file.name,
            file_url: publicUrl,
            file_path: filePath,
            size: file.size,
            file_type: getFileType(file.type),
            user_id: user.id,
            folder_id: targetFolderId || currentFolder
          }])

        if (dbError) throw dbError

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }))
      }

      toast({
        title: 'Success',
        description: 'Files uploaded successfully'
      })

      // Reload files and trigger storage update
      loadFiles()
      loadFolders()
      triggerStorageUpdate()
      onFilesUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Error uploading files',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Hide the overlay immediately when files are dropped
    setIsDragOverlay(false)
    
    if (acceptedFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload up to 10 files at once",
        variant: "destructive"
      })
      return
    }
    
    // Check if we have actual files (not empty folders)
    if (acceptedFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "The dropped item doesn't contain any valid files",
        variant: "destructive"
      })
      return
    }
    
    handleUpload(acceptedFiles)
  }, [user?.id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md']
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    noClick: true, // Prevent opening file dialog on click
    noKeyboard: true, // Prevent opening file dialog on keypress
    onDragEnter: () => setIsDragOverlay(true),
    onDragLeave: () => setIsDragOverlay(false)
  })

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage if path exists
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .remove([filePath])
        
        if (storageError) throw storageError
      }
      
      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'File deleted successfully'
      })

      loadFiles()
      triggerStorageUpdate()
      onFilesUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Error deleting file',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      // First, delete all files in the folder
      const { error: filesError } = await supabase
        .from('files')
        .delete()
        .eq('folder_id', folderId)

      if (filesError) throw filesError

      // Then delete the folder
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (folderError) throw folderError

      toast({
        title: 'Success',
        description: `Folder "${folderName}" deleted successfully`
      })

      loadFiles()
      loadFolders()
      triggerStorageUpdate()
      onFilesUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Error deleting folder',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast({
        title: 'Error downloading file',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.includes('pdf')) return 'document'
    return 'file'
  }

  const createFolder = async (name: string) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('folders')
        .insert([{
          name,
          user_id: user.id,
          parent_id: currentFolder
        }])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Folder created successfully'
      })

      setShowNewFolderDialog(false)
      setNewFolderName('')
      loadFolders()
      onFilesUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Error creating folder',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const navigateToFolder = (folder: FolderItem) => {
    setCurrentFolder(folder.id)
    setFolderStack(prev => [...prev, folder])
  }

  const navigateUp = () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack]
      newStack.pop()
      setFolderStack(newStack)
      setCurrentFolder(newStack.length > 0 ? newStack[newStack.length - 1].id : null)
    }
  }

  const getCurrentFiles = () => {
    return files.filter(file => file.folder_id === currentFolder)
  }

  const getCurrentFolders = () => {
    return folders.filter(folder => folder.parent_id === currentFolder)
  }

  const startRenameFolder = (folderId: string, currentName: string) => {
    setRenamingFolder(folderId)
    setRenameInput(currentName)
    setDropdownOpen(null)
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus()
        renameInputRef.current.select()
      }
    }, 100)
  }

  const submitRenameFolder = async () => {
    if (!renamingFolder || !renameInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid folder name',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: renameInput.trim() })
        .eq('id', renamingFolder)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Folder renamed successfully'
      })
      setRenamingFolder(null)
      setRenameInput('')
      loadFolders()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to rename folder: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const startRenameFile = (fileId: string, currentName: string) => {
    setRenamingFile(fileId)
    setRenameInput(currentName)
    setDropdownOpen(null)
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus()
        renameInputRef.current.select()
      }
    }, 100)
  }

  const submitRenameFile = async () => {
    if (!renamingFile || !renameInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid file name',
        variant: 'destructive'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('files')
        .update({ name: renameInput.trim() })
        .eq('id', renamingFile)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'File renamed successfully'
      })
      setRenamingFile(null)
      setRenameInput('')
      loadFiles()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to rename file: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const handleRenameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (renamingFolder) {
        submitRenameFolder()
      } else if (renamingFile) {
        submitRenameFile()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (renamingFolder) {
        setRenamingFolder(null)
        setRenameInput('')
      } else if (renamingFile) {
        setRenamingFile(null)
        setRenameInput('')
      }
    }
  }

  const handleStarItem = async (itemId: string, itemType: 'file' | 'folder') => {
    try {
      if (itemType === 'file') {
        const file = files.find(f => f.id === itemId)
        if (file) {
          const isCurrentlyStarred = file.starred || false
          const { error } = await supabase
            .from('files')
            .update({ starred: !isCurrentlyStarred })
            .eq('id', itemId)

          if (error) throw error

          toast({
            title: 'Success',
            description: isCurrentlyStarred ? `Unstarred "${file.name}"` : `Starred "${file.name}"`
          })
        }
      } else if (itemType === 'folder') {
        const folder = folders.find(f => f.id === itemId)
        if (folder) {
          const isCurrentlyStarred = folder.starred || false
          const { error } = await supabase
            .from('folders')
            .update({ starred: !isCurrentlyStarred })
            .eq('id', itemId)

          if (error) throw error

          toast({
            title: 'Success',
            description: isCurrentlyStarred ? `Unstarred "${folder.name}"` : `Starred "${folder.name}"`
          })
        }
      }

      loadFiles()
      loadFolders()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to star item: ${error.message}`,
        variant: 'destructive'
      })
    }
  }

  const handleRefresh = () => {
    loadFiles()
    loadFolders()
  }

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedFile || draggedFolder) return
    setDragCounter(prev => prev + 1)
  }, [draggedFile, draggedFolder])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedFile || draggedFolder) return
    setDragCounter(prev => Math.max(prev - 1, 0))
  }, [draggedFile, draggedFolder])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(0)
    setIsDragOverlay(false)

    if (draggedFile || draggedFolder) {
      // Internal drag-and-drop
      return
    }

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files)
      const supportedFiles = files.filter(file =>
        file.type.startsWith('audio/') ||
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type.includes('pdf')
      )
      if (supportedFiles.length > 0) {
        handleUpload(supportedFiles)
      } else {
        toast({
          title: 'Warning',
          description: 'No supported file types found. Only audio, image, video, and PDF files are accepted.',
          variant: 'destructive'
        })
      }
    }
  }, [draggedFile, draggedFolder, handleUpload])

  const handleFilesDroppedOnFolder = useCallback((files: File[], folderId: string) => {
    const supportedFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.includes('pdf')
    )

    if (supportedFiles.length === 0) {
      toast({
        title: 'Warning',
        description: 'No supported file types found. Only audio, image, video, and PDF files are accepted.',
        variant: 'destructive'
      })
      return
    }

    const filesToUpload = supportedFiles.slice(0, 10)
    if (supportedFiles.length > 10) {
      toast({
        title: 'Warning',
        description: 'Only up to 10 files are allowed at once.',
        variant: 'destructive'
      })
    }

    handleUpload(filesToUpload, folderId)
  }, [handleUpload])

  useEffect(() => {
    if (user?.id) {
      loadFiles()
      loadFolders()
    }
  }, [user?.id])

  const isDragging = dragCounter > 0

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('my-files')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my-files'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Folder className="h-4 w-4" />
            My Files ({files.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('purchased')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'purchased'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            Purchased ({purchasedFiles.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'my-files' ? (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div 
                className={cn('w-full h-full')}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      setCurrentFolder(null)
                      setFolderStack([])
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    <FolderOpen className="h-4 w-4" />
                    All Files
                  </button>
                  {folderStack.map((folder, index) => (
                    <div key={folder.id} className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => {
                          const newStack = folderStack.slice(0, index + 1)
                          setFolderStack(newStack)
                          setCurrentFolder(folder.id)
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-md text-sm hover:bg-muted transition-colors"
                      >
                        {folder.name}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowNewFolderDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      New Folder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefresh}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getCurrentFiles().length} files, {getCurrentFolders().length} folders
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  {...getRootProps()}
                  className={cn(
                    'relative w-full p-8 text-center border-2 border-dashed rounded-lg transition-colors mb-4',
                    'hover:border-primary/50 hover:bg-muted/50',
                    isDragActive ? 'border-primary bg-muted/50' : 'border-muted-foreground/25',
                    isUploading && 'pointer-events-none opacity-50'
                  )}
                >
                  <input {...getInputProps()} />

                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or <button
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.multiple = true
                            input.accept = 'audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac,image/*,.jpg,.jpeg,.png,.gif,.pdf,.txt,.md'
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files
                              if (files && files.length > 0) {
                                handleUpload(Array.from(files))
                              }
                            }
                            input.click()
                          }}
                          className="text-primary hover:underline focus:outline-none"
                        >
                          click to select files
                        </button>
                      </p>
                    </div>
                    {isUploading && Object.keys(uploadProgress).length > 0 && (
                      <div className="w-full max-w-xs mx-auto space-y-2">
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                          <div key={fileName} className="space-y-1">
                            <p className="text-sm text-muted-foreground">{fileName}</p>
                            <Progress value={progress} className="h-1" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Drag overlay that appears when dragging files over the page */}
                {isDragOverlay && (
                  <div
                    className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 transition-opacity duration-300 pointer-events-none opacity-100"
                    onDragLeave={() => setIsDragOverlay(false)}
                  >
                    <div
                      className="p-12 rounded-xl border-2 border-dashed border-primary bg-background/95 shadow-lg transition-all duration-300 transform scale-100"
                      {...getRootProps()}
                    >
                      <input {...getInputProps()} />
                      <div className="text-center space-y-4">
                        <Upload className="w-16 h-16 mx-auto text-primary" />
                        <div>
                          <p className="text-xl font-medium">Drop files here</p>
                          <p className="text-muted-foreground mt-2">Release to upload your files</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Folders Grid */}
                {getCurrentFolders().length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">Folders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getCurrentFolders().map(folder => (
                        <ContextMenu key={folder.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              key={folder.id}
                              onClick={() => navigateToFolder(folder)}
                              className="group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                                  <Folder className="w-6 h-6 text-blue-600" />
                                </div>
                                <DropdownMenu open={dropdownOpen === folder.id} onOpenChange={(open) => setDropdownOpen(open ? folder.id : null)}>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-blue-500/10"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenameFolder(folder.id, folder.name); }}>
                                      <Pencil className="h-4 w-4 mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStarItem(folder.id, 'folder'); }}>
                                      <Star className="h-4 w-4 mr-2" /> {folder.starred ? 'Unstar' : 'Star'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="space-y-2">
                                {renamingFolder === folder.id ? (
                                  <Input
                                    ref={renameInputRef}
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    onKeyDown={handleRenameKeyPress}
                                    onBlur={() => {
                                      if (renamingFolder === folder.id) {
                                        submitRenameFolder()
                                      }
                                    }}
                                    className="h-6 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {folder.name}
                                  </h3>
                                )}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                    FOLDER
                                  </span>
                                  <span>{folder.file_count || 0} items</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Modified: {new Date(folder.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="absolute inset-0 bg-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-64">
                            <ContextMenuItem onClick={() => navigateToFolder(folder)}>
                              <FolderOpen className="h-4 w-4 mr-2" /> Open Folder
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => startRenameFolder(folder.id, folder.name)}>
                              <Pencil className="h-4 w-4 mr-2" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleStarItem(folder.id, 'folder')}>
                              <Star className="h-4 w-4 mr-2" /> {folder.starred ? 'Unstar' : 'Star'}
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteFolder(folder.id, folder.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Folder
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Grid */}
                {getCurrentFiles().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentFiles().map(file => (
                      <ContextMenu key={file.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          key={file.id}
                          onClick={async () => {
                            if (!project) {
                              toast({
                                title: 'Error',
                                description: 'No project selected',
                                variant: 'destructive'
                              })
                              return
                            }

                            if (!user) {
                              toast({
                                title: 'Error',
                                description: 'Please sign in to add files to projects',
                                variant: 'destructive'
                              })
                              return
                            }

                            try {
                              // Check if file is already attached
                              const { data: existingFiles, error: checkError } = await supabase
                                .from('project_files')
                                .select('id')
                                .eq('project_id', project.id)
                                .eq('file_id', file.id)

                              if (checkError) throw checkError

                              if (existingFiles && existingFiles.length > 0) {
                                toast({
                                  title: 'Info',
                                  description: 'File is already attached to this project'
                                })
                                return
                              }

                              // Attach file to project
                              const { error: attachError } = await supabase
                                .from('project_files')
                                .insert({
                                  project_id: project.id,
                                  file_id: file.id,
                                  file_name: file.name,
                                  file_url: file.file_path || '',
                                  file_type: file.type || 'unknown',
                                  file_size: parseInt(file.size.replace(/[^0-9]/g, '')) || 0,
                                  file_extension: file.name?.split('.').pop() || '',
                                  user_id: user.id,
                                  folder_id: null, // Add to root folder
                                  position: 0 // Required position field
                                })

                              if (attachError) throw attachError

                              toast({
                                title: 'Success',
                                description: `Added "${file.name}" to ${project.title}`
                              })
                              onFilesUpdated?.()
                            } catch (error) {
                              console.error('Error attaching file:', error)
                              toast({
                                title: 'Error',
                                description: 'Failed to add file to project',
                                variant: 'destructive'
                              })
                            }
                          }}
                          className="group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                        >
                            {/* File Type Icon */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                {file.type === 'audio' ? (
                                  <File className="w-6 h-6 text-primary" />
                                ) : file.type === 'image' ? (
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                                    <File className="w-4 h-4 text-white" />
                                  </div>
                                ) : file.type === 'video' ? (
                                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded flex items-center justify-center">
                                    <File className="w-4 h-4 text-white" />
                                  </div>
                                ) : file.type === 'document' ? (
                                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-yellow-500 rounded flex items-center justify-center">
                                    <File className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <Folder className="w-6 h-6 text-primary" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.audio_url && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFile(file.audio_url!, file.name)}
                                    className="h-8 w-8 hover:bg-primary/10"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                <DropdownMenu open={dropdownOpen === file.id} onOpenChange={(open) => setDropdownOpen(open ? file.id : null)}>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {file.audio_url && (
                                      <DropdownMenuItem onClick={() => handleDownloadFile(file.audio_url!, file.name)}>
                                        <Download className="h-4 w-4 mr-2" /> Download
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenameFile(file.id, file.name); }}>
                                      <Pencil className="h-4 w-4 mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStarItem(file.id, 'file')}>
                                      <Star className="h-4 w-4 mr-2" /> {file.starred ? 'Unstar' : 'Star'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={async () => {
                                        await handleDeleteFile(file.id, file.file_path!)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* File Info */}
                            <div className="space-y-2">
                              {renamingFile === file.id ? (
                                <Input
                                  ref={renameInputRef}
                                  value={renameInput}
                                  onChange={(e) => setRenameInput(e.target.value)}
                                  onKeyDown={handleRenameKeyPress}
                                  onBlur={() => {
                                    if (renamingFile === file.id) {
                                      submitRenameFile()
                                    }
                                  }}
                                  className="h-6 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                  {file.name}
                                </h3>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="bg-muted px-2 py-1 rounded-full text-xs">
                                  {file.type.toUpperCase()}
                                </span>
                                <span>{file.size}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Modified: {file.modified}</span>
                              </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-64">
                          {file.audio_url && (
                            <ContextMenuItem onClick={() => handleDownloadFile(file.audio_url!, file.name)}>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </ContextMenuItem>
                          )}
                          <ContextMenuItem onClick={() => startRenameFile(file.id, file.name)}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleStarItem(file.id, 'file')}>
                            <Star className="h-4 w-4 mr-2" /> {file.starred ? 'Unstar' : 'Star'}
                          </ContextMenuItem>
                          <ContextMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              await handleDeleteFile(file.id, file.file_path!)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                ) : getCurrentFolders().length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <div className="flex flex-col items-center justify-center">
                      <File className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No files found</h3>
                      <p className="text-muted-foreground mb-4 max-w-sm">
                        {currentFolder
                          ? 'This folder is empty. Drag and drop files here or click to select files.'
                          : 'You haven\'t uploaded any files yet. Drag and drop files here or click to select files.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuItem onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = 'audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac,image/*,.jpg,.jpeg,.png,.gif,.pdf,.txt,.md'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files && files.length > 0) {
                    handleUpload(Array.from(files))
                  }
                }
                input.click()
              }}>
                <Upload className="h-4 w-4 mr-2" /> Upload Files
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setShowNewFolderDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-2" /> New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Files you've purchased from other creators
            </div>
            
            {purchasedFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchasedFiles.map((file, index) => (
                  <div
                    key={`${file.id}-${index}`}
                    className="group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:border-green-500/50 transition-all duration-200 hover:-translate-y-1"
                  >
                    {/* Purchased File Icon */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file.url, file.name)}
                            className="h-8 w-8 hover:bg-green-500/10"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-green-600 transition-colors">
                        {file.name}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            PURCHASED
                          </span>
                          <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}</span>
                        </div>
                        {file.item_title && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            From: {file.item_title}
                          </p>
                        )}
                        {file.order_date && (
                          <p className="text-xs text-muted-foreground">
                            Purchased: {new Date(file.order_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hover Background */}
                    <div className="absolute inset-0 bg-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <div className="flex flex-col items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No purchased files</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Files you purchase from the marketplace will appear here
                  </p>
                  <Button variant="outline" size="sm">
                    Browse Marketplace
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="folderName" className="block text-sm font-medium mb-2">
                  Folder Name
                </label>
                <input
                  id="folderName"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-muted-foreground/25 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewFolderDialog(false)
                    setNewFolderName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      createFolder(newFolderName.trim())
                    }
                  }}
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}