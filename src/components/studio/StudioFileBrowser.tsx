'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/@/ui/button'
import { Input } from '@/components/@/ui/input'
import {
  Search,
  Folder,
  File,
  Music,
  Image,
  Video,
  FileText,
  MoreVertical,
  Download,
  Trash2,
  Upload,
  ChevronRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu'

interface FileItem {
  id: string
  name: string
  file_type: string
  size: number
  file_url: string
  file_path: string | null
  created_at: string
  folder_id: string | null
}

interface FolderItem {
  id: string
  name: string
  created_at: string
  parent_id: string | null
}

export default function StudioFileBrowser() {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchFilesAndFolders()
    }
  }, [user, currentFolder])

  const fetchFilesAndFolders = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Fetch folders - use .is() for null comparison instead of .eq()
      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (currentFolder === null) {
        foldersQuery = foldersQuery.is('parent_id', null)
      } else {
        foldersQuery = foldersQuery.eq('parent_id', currentFolder)
      }

      const { data: foldersData, error: foldersError } = await foldersQuery
      if (foldersError) throw foldersError

      // Fetch files - use .is() for null comparison instead of .eq()
      let filesQuery = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (currentFolder === null) {
        filesQuery = filesQuery.is('folder_id', null)
      } else {
        filesQuery = filesQuery.eq('folder_id', currentFolder)
      }

      const { data: filesData, error: filesError } = await filesQuery

      if (filesError) throw filesError

      setFolders(foldersData || [])
      setFiles(filesData || [])
    } catch (error) {
      console.error('Error fetching files and folders:', error)
      toast.error('Failed to load your files')
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="h-5 w-5 text-green-500" />
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />
      case 'pdf':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId)
  }

  const handleDeleteFile = async (fileId: string, filePath: string | null, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return

    try {
      // Delete from storage if file path exists
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([filePath])

        if (storageError) throw storageError
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      toast.success('File deleted successfully')
      fetchFilesAndFolders()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete folder "${folderName}" and all its contents?`)) return

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      toast.success('Folder deleted successfully')
      fetchFilesAndFolders()
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder')
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Browser</h2>
          <p className="text-muted-foreground">
            Manage all your uploaded files and folders
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigateToFolder(null)}
          className="hover:text-foreground transition-colors"
        >
          Root
        </button>
        {currentFolder && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Current Folder</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Folders */}
      {filteredFolders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFolders.map(folder => (
              <div
                key={folder.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                onClick={() => navigateToFolder(folder.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(folder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder.id, folder.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h3 className="text-lg font-medium mb-4">Files</h3>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No files found</h4>
            <p className="text-muted-foreground">
              {currentFolder ? 'This folder is empty' : 'You haven\'t uploaded any files yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.file_type)}
                    <span className="font-medium truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(file.file_url, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteFile(file.id, file.file_path, file.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
