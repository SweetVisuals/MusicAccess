import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { 
  Music, 
  Image, 
  FileText, 
  Video, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  Check,
  File,
  Folder,
  FolderPlus,
  Search,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  Star,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Card, CardContent } from "@/components/@/ui/card";
import { useDropzone } from 'react-dropzone';
import { Progress } from "@/components/@/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";

export default function UploadWizard() {
  const { user, fetchStorageUsage } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  // Storage usage state removed as requested
  const [dragCounter, setDragCounter] = useState(0); // Track drag events to prevent flickering
  
  // Delete confirmation dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'file' | 'folder' | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemPath, setDeleteItemPath] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');

  // Custom drag handling to prevent flickering
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile) return;
    setDragCounter(prev => prev + 1);
  }, [draggedFile]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile) return;
    setDragCounter(prev => Math.max(prev - 1, 0));
  }, [draggedFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  // Handle drop event separately to ensure we process files correctly
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0); // Reset drag counter immediately
  
    if (draggedFile) {
      // This is an internal drag-and-drop, move to root
      try {
        const fileToMove = uploadedFiles.find(f => f.id === draggedFile);
        if (fileToMove && fileToMove.folder_id !== null) {
          await supabase.from('files').update({ folder_id: null }).eq('id', draggedFile);
          toast.success('File moved to All Files');
          fetchFiles();
        }
      } catch (error) {
        console.error('Error moving file to root:', error);
        toast.error('Failed to move file');
      } finally {
        setDraggedFile(null);
      }
      return;
    }
  
    // Process dropped items for upload
    if (e.dataTransfer.items) {
      processDroppedItems(e.dataTransfer.items);
    } else if (e.dataTransfer.files) {
      const audioFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type.startsWith('audio/'))
        .slice(0, 10);
  
      if (audioFiles.length > 0) {
        handleUpload(audioFiles);
      } else {
        toast.warning('No valid audio files found in the dropped items.');
      }
    }
  }, [draggedFile, uploadedFiles]);
  
  // Process dropped items including folder traversal
  const processDroppedItems = async (items: DataTransferItemList) => {
    const audioFiles: File[] = [];
    const promises: Promise<void>[] = [];
    
    // Function to recursively process entries (files and folders)
    const processEntry = async (entry: FileSystemEntry) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const promise = new Promise<void>((resolve) => {
          fileEntry.file((file) => {
            if (file.type.startsWith('audio/')) {
              audioFiles.push(file);
            }
            resolve();
          }, () => resolve());
        });
        promises.push(promise);
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const promise = new Promise<void>((resolve) => {
          const reader = dirEntry.createReader();
          const readEntries = () => {
            reader.readEntries(async (entries) => {
              if (entries.length > 0) {
                await Promise.all(entries.map(processEntry));
                readEntries(); // Continue reading if there are more entries
              } else {
                resolve();
              }
            }, () => resolve());
          };
          readEntries();
        });
        promises.push(promise);
      }
    };
    
    // Process all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }
    }
    
    // Wait for all processing to complete
    await Promise.all(promises);
    
    // Handle the collected audio files
    if (audioFiles.length > 0) {
      const filesToUpload = audioFiles.slice(0, 10);
      if (audioFiles.length > 10) {
        toast.warning('Only up to 10 files are allowed at once.');
      }
      handleUpload(filesToUpload);
    } else {
      toast.warning('No valid audio files found in the dropped items.');
    }
  };

  // Determine if dragging based on counter instead of the built-in isDragActive
  const isDragging = dragCounter > 0;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // This won't be called for our custom drop handler
    // But we keep it for the file dialog functionality
    if (acceptedFiles.length === 0) {
      toast.warning('No valid audio files selected.');
      return;
    }
    
    // Filter for audio files and limit to 10
    const audioFiles = acceptedFiles.filter(file => file.type.startsWith('audio/')).slice(0, 10);
    setFiles(audioFiles);
    if (acceptedFiles.length > 10) {
      toast.warning('Only up to 10 files are allowed at once.');
    }
    if (audioFiles.length < acceptedFiles.length) {
      toast.warning('Only audio files are accepted.');
    }
    // Automatically trigger upload after files are dropped
    if (audioFiles.length > 0) {
      handleUpload(audioFiles);
    }
  }, []);

  const { open, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
    },
    maxFiles: 10, // This is handled in onDrop as well for user feedback
    multiple: true,
    noClick: true, // Disable click to open file dialog
    noKeyboard: true, // Disable keyboard navigation
    preventDropOnDocument: true, // We need to handle drops on the document
  });


  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
    }
  }, [user, currentFolder]);
  
  // Storage usage function removed as requested

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);
      
      if (currentFolder) {
        query = query.eq('parent_id', currentFolder);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  };

  const handleUpload = async (filesToUpload: File[]) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }
    
    if (filesToUpload.length === 0) {
      toast.error('No files to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Process each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${fileId}.${fileExt}`;
        
        // Update progress based on file size and position in queue
        const currentProgress = Math.round(((i + 0.5) / filesToUpload.length) * 100);
        setUploadProgress(currentProgress);
        
        // Upload to Supabase Storage with progress tracking
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Allow overwriting files with same name
            contentType: file.type // Set proper content type
          });
        
        if (storageError) throw storageError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);
        
        // Add to database with additional metadata
        // Prepare the base object with required fields
        const fileData: Record<string, any> = {
          id: fileId,
          name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          size: file.size,
          file_type: getFileType(file.type),
          user_id: user.id
        };
        
        // Only add folder_id if it exists and is not null
        if (currentFolder) {
          fileData.folder_id = currentFolder;
        }
        
        // Insert the file record with only the fields that exist in the schema
        const { error: dbError } = await supabase
          .from('files')
          .insert([fileData]);
        
        if (dbError) throw dbError;
        
        // Update progress for this file
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Show success message with count
      toast.success(`${filesToUpload.length} file${filesToUpload.length > 1 ? 's' : ''} uploaded successfully`);
      
      // Clear files and refresh the list
      setFiles([]);
      fetchFiles();
      fetchFolders(); // Also refresh folders in case we need to update counts
      fetchStorageUsage();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload files: ${error.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500); // Slightly longer to ensure user sees 100% completion
    }
  };

  const handleCreateFolder = async () => {
    if (!user) {
      toast.error('You must be logged in to create folders');
      return;
    }
    
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    
    console.log('Creating folder with:', {
      name: newFolderName.trim(),
      user_id: user.id,
      parent_id: currentFolder
    });

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          user_id: user.id,
          parent_id: currentFolder
        }])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Folder created successfully:', data);
      toast.success('Folder created successfully');
      setNewFolderName('');
      setShowNewFolderDialog(false);
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFile = async (id: string, filePath: string, fileName: string) => {
    if (!user) return;
    
    // Open the delete confirmation dialog
    setDeleteItemType('file');
    setDeleteItemId(id);
    setDeleteItemPath(filePath);
    setDeleteItemName(fileName);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteFile = async () => {
    if (!user || !deleteItemId || deleteItemType !== 'file') return;
    
    try {
      // Delete from storage
      if (deleteItemPath) {
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .remove([deleteItemPath]);
        
        if (storageError) throw storageError;
      }
      
      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', deleteItemId);
      
      if (error) throw error;
      
      toast.success('File deleted successfully');
      fetchFiles();
      fetchStorageUsage();
      
      // Close the dialog and reset state
      setShowDeleteDialog(false);
      setDeleteItemType(null);
      setDeleteItemId(null);
      setDeleteItemPath(null);
      setDeleteItemName('');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (id: string, folderName: string) => {
    if (!user) return;
    
    // Open the delete confirmation dialog
    setDeleteItemType('folder');
    setDeleteItemId(id);
    setDeleteItemName(folderName);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteFolder = async () => {
    if (!user || !deleteItemId || deleteItemType !== 'folder') return;
    
    try {
      // Get all files in this folder
      const { data: folderFiles, error: filesError } = await supabase
        .from('files')
        .select('id, file_path')
        .eq('folder_id', deleteItemId);
      
      if (filesError) throw filesError;
      
      // Delete all files in the folder from storage
      if (folderFiles && folderFiles.length > 0) {
        const filePaths = folderFiles.map(file => file.file_path).filter(Boolean);
        
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('audio_files')
            .remove(filePaths);
          
          if (storageError) throw storageError;
        }
        
        // Delete all file records
        const { error: dbFilesError } = await supabase
          .from('files')
          .delete()
          .eq('folder_id', deleteItemId);
        
        if (dbFilesError) throw dbFilesError;
      }
      
      // Delete the folder itself
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', deleteItemId);
      
      if (folderError) throw folderError;
      
      toast.success('Folder deleted successfully');
      fetchFolders();
      fetchStorageUsage();
      
      // Close the dialog and reset state
      setShowDeleteDialog(false);
      setDeleteItemType(null);
      setDeleteItemId(null);
      setDeleteItemName('');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const sortFiles = (files: any[]) => {
    return [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOrder) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const searchedFiles = uploadedFiles
    .filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filesInView = searchedFiles.filter(file => file.folder_id === currentFolder);
  const sortedFilesInView = sortFiles(filesInView);

  const rootFiles = currentFolder ? searchedFiles.filter(file => file.folder_id === null) : [];
  const sortedRootFiles = sortFiles(rootFiles);

  const filteredFolders = folders
    .filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleChangeSortOrder = (order: 'name' | 'date' | 'size') => {
    if (sortOrder === order) {
      handleToggleSort();
    } else {
      setSortOrder(order);
      setSortDirection('desc');
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in">
            <div className="flex flex-col h-full">
              {/* Header with breadcrumbs and actions */}
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      className="h-8 px-2"
                      onClick={() => navigateToFolder(null)}
                    >
                      All Files
                    </Button>
                    {currentFolder && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Button variant="ghost" className="h-8 px-2">
                          {folders.find(f => f.id === currentFolder)?.name || 'Folder'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewFolderDialog(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button variant="default" onClick={() => open()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </div>

            {/* Storage bar removed as requested */}
            
            {/* Search and filters */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files and folders..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Sort: {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeSortOrder('name')}>
                        Name {sortOrder === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeSortOrder('date')}>
                        Date {sortOrder === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeSortOrder('size')}>
                        Size {sortOrder === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="px-6 py-4 bg-primary/5 border-b shadow-sm rounded-md my-2 mx-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <Upload className="h-4 w-4 animate-bounce text-primary" />
                      </div>
                      <span className="text-sm font-medium">Uploading {files.length} file(s)...</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      {Math.round(uploadProgress)}%
                    </Badge>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Processing files...</span>
                    <span>{Math.round(uploadProgress) === 100 ? 'Complete!' : 'Uploading...'}</span>
                  </div>
                </div>
              )}

              {/* File browser */}
              <div className="flex-1 p-6 overflow-auto"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Folders */}
                    {filteredFolders.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-medium mb-4">Folders</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredFolders.map(folder => (
                            <div 
                              key={folder.id}
                              className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${dropTarget === folder.id ? 'bg-primary/10 scale-105 border-primary' : ''}`}
                              onClick={() => navigateToFolder(folder.id)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedFile) {
                                  setDropTarget(folder.id);
                                }
                              }}
                              onDragLeave={() => setDropTarget(null)}
                              onDrop={async (e) => {
                                e.preventDefault();
                                setDropTarget(null);
                                if (draggedFile) {
                                  try {
                                    await supabase.from('files').update({ folder_id: folder.id }).eq('id', draggedFile);
                                    toast.success('File moved successfully');
                                    fetchFiles();
                                  } catch (error) {
                                    console.error('Error moving file:', error);
                                    toast.error('Failed to move file');
                                  } finally {
                                    setDraggedFile(null);
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                  <div className="flex-shrink-0">
                                    <Folder className="h-5 w-5 text-primary" />
                                  </div>
                                  <span className="font-medium truncate" title={folder.name}>{folder.name}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      // Rename folder functionality
                                    }}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      // Star folder functionality
                                    }}>
                                      <Star className="h-4 w-4 mr-2" />
                                      Star
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder.id, folder.name);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="text-xs text-muted-foreground mt-auto pt-2">
                                Created {new Date(folder.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    <div>
                      <h2 className="text-lg font-medium mb-4">
                        {currentFolder ? folders.find(f => f.id === currentFolder)?.name || 'Files' : 'Files'}
                      </h2>
                      {sortedFilesInView.length === 0 ? (
                        <div
                            className={`text-center py-12 border-2 border-dashed rounded-lg transition-all duration-300 ${
                              isDragging
                                ? 'border-primary bg-primary/5 scale-[1.02]'
                                : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
                            }`}
                            role="presentation"
                            tabIndex={0}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                          
                          <div className="mx-auto w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4 relative group">
                            <div className="absolute inset-0 rounded-full bg-primary/10 group-hover:animate-ping opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                            <File className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                          </div>
                          <h3 className="text-lg font-medium">No files found</h3>
                          <p className="text-muted-foreground mt-2 mb-4">
                            {currentFolder ? 'This folder is empty' : 'You haven\'t uploaded any files yet'}
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4 group hover:bg-primary hover:text-white transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                            Upload Files
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {sortedFilesInView.map(file => (
                            <div
                              key={file.id}
                              draggable
                              onDragStart={() => setDraggedFile(file.id)}
                              onDragEnd={() => setDraggedFile(null)}
                              className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${draggedFile === file.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                  <div className="flex-shrink-0">
                                    {getFileIcon(file.file_type)}
                                  </div>
                                  <span className="font-medium truncate" title={file.name}>{file.name}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      // Download file
                                      window.open(file.file_url, '_blank');
                                    }}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      // Rename file functionality
                                    }}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      // Star file functionality
                                    }}>
                                      <Star className="h-4 w-4 mr-2" />
                                      Star
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
                              <div className="mt-2 flex-1 flex flex-col">
                                {file.file_type === 'audio' && (
                                  <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                    <Music className="h-8 w-8 text-primary/50" />
                                  </div>
                                )}
                                {file.file_type === 'image' && (
                                  <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                    <Image className="h-8 w-8 text-green-500/50" />
                                  </div>
                                )}
                                {file.file_type === 'video' && (
                                  <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                    <Video className="h-8 w-8 text-red-500/50" />
                                  </div>
                                )}
                                {(file.file_type !== 'audio' && file.file_type !== 'image' && file.file_type !== 'video') && (
                                  <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                    <File className="h-8 w-8 text-muted-foreground/50" />
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-auto space-y-1">
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Home Files (when in a folder) */}
                    {currentFolder && (
                      <div className="mt-8">
                        <h2 className="text-lg font-medium mb-4">All Files</h2>
                        {sortedRootFiles.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted-foreground/25">
                            <p className="text-muted-foreground">No files in the main directory.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {sortedRootFiles.map(file => (
                              <div
                                key={file.id}
                                draggable
                                onDragStart={() => setDraggedFile(file.id)}
                                onDragEnd={() => setDraggedFile(null)}
                                className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${draggedFile === file.id ? 'opacity-50 scale-95' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 max-w-[80%]">
                                    <div className="flex-shrink-0">
                                      {getFileIcon(file.file_type)}
                                    </div>
                                    <span className="font-medium truncate" title={file.name}>{file.name}</span>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        // Download file
                                        window.open(file.file_url, '_blank');
                                      }}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        // Rename file functionality
                                      }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        // Star file functionality
                                      }}>
                                        <Star className="h-4 w-4 mr-2" />
                                        Star
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
                                <div className="mt-2 flex-1 flex flex-col">
                                  {file.file_type === 'audio' && (
                                    <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                      <Music className="h-8 w-8 text-primary/50" />
                                    </div>
                                  )}
                                  {file.file_type === 'image' && (
                                    <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                      <Image className="h-8 w-8 text-green-500/50" />
                                    </div>
                                  )}
                                  {file.file_type === 'video' && (
                                    <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                      <Video className="h-8 w-8 text-red-500/50" />
                                    </div>
                                  )}
                                  {(file.file_type !== 'audio' && file.file_type !== 'image' && file.file_type !== 'video') && (
                                    <div className="bg-muted/50 rounded-md h-24 flex items-center justify-center mb-2">
                                      <File className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-auto space-y-1">
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
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              {deleteItemType === 'file' ? (
                <>Are you sure you want to delete the file <span className="font-medium text-foreground">{deleteItemName}</span>?</>
              ) : (
                <>Are you sure you want to delete the folder <span className="font-medium text-foreground">{deleteItemName}</span> and all its contents?</>
              )}
            </p>
            <p className="text-center text-sm text-destructive mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteItemType === 'file' ? confirmDeleteFile() : confirmDeleteFolder()}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete {deleteItemType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
