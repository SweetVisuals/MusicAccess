import { Button } from "@/components/ui/button";
import {
  Music,
  Image,
  FileText,
  Video,
  File,
  Folder,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  Star,
  Upload,
  FolderPlus,
  RefreshCw,
  Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { UploadedFile } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { MetadataDialog, AudioMetadata } from './MetadataDialog';

interface FileBrowserProps {
  isLoading: boolean;
  folders: any[];
  files: UploadedFile[];
  currentFolder: string | null;
  currentFolderName: string | null;
  dropTarget: string | null;
  draggedFile: string | null;
  draggedFolder: string | null;
  selectedItems: string[];
  isDragging: boolean;
  handleFileDoubleClick: (file: UploadedFile) => void;
  handleDeleteFile: (id: string, filePath: string | null, name: string) => void;
  handleDeleteFolder: (id: string, name: string) => void;
  navigateToFolder: (id: string | null) => void;
  setDraggedFile: (id: string | null) => void;
  setDraggedFolder: (id: string | null) => void;
  setDropTarget: (id: string | null) => void;
  setSelectedItems: (items: string[]) => void;
  openFilePicker: () => void;
  setShowNewFolderDialog: (show: boolean) => void;
  handleRefresh: () => void;
  handleDownloadSelected: () => void;
  handleDeleteSelected: () => void;
  supabase: any; // Pass supabase client for file moving
  toast: any;
  uploadedFiles: UploadedFile[];
  onFilesDroppedOnFolder?: (files: File[], folderId: string) => void;
  onContextMenuOpen?: (open: boolean) => void;
  contextMenuItems?: React.ReactNode;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'audio':
      return <Music className="h-5 w-5 text-green-500" />;
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

const formatFileSize = (bytes: number): string => {
     if (bytes === 0) return '0 Bytes';

     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));

     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
 };

const getFileFormat = (fileName: string, filePath?: string | null): string => {
  // First try to get extension from filePath if available (more reliable)
  if (filePath && filePath.includes('.')) {
    const pathExtension = filePath.split('.').pop()?.toLowerCase();
    if (pathExtension) {
      const formatMap: { [key: string]: string } = {
        'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
        'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
        'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
        'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
        'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
        'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
        'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ'
      };
      return formatMap[pathExtension] || pathExtension.toUpperCase();
    }
  }

  // Fallback to filename if filePath doesn't work
  if (fileName && fileName.includes('.')) {
    const nameExtension = fileName.split('.').pop()?.toLowerCase();
    if (nameExtension) {
      const formatMap: { [key: string]: string } = {
        'mp3': 'MP3', 'wav': 'WAV', 'flac': 'FLAC', 'aac': 'AAC', 'ogg': 'OGG',
        'wma': 'WMA', 'm4a': 'M4A', 'aiff': 'AIFF', 'au': 'AU', 'ra': 'RA',
        'mp4': 'MP4', 'avi': 'AVI', 'mov': 'MOV', 'wmv': 'WMV', 'flv': 'FLV',
        'webm': 'WEBM', 'mkv': 'MKV', 'jpg': 'JPG', 'jpeg': 'JPEG', 'png': 'PNG',
        'gif': 'GIF', 'bmp': 'BMP', 'tiff': 'TIFF', 'webp': 'WEBP', 'svg': 'SVG',
        'pdf': 'PDF', 'doc': 'DOC', 'docx': 'DOCX', 'txt': 'TXT', 'rtf': 'RTF',
        'odt': 'ODT', 'zip': 'ZIP', 'rar': 'RAR', '7z': '7Z', 'tar': 'TAR', 'gz': 'GZ'
      };
      return formatMap[nameExtension] || nameExtension.toUpperCase();
    }
  }

  return 'Unknown';
};

export function FileBrowser({
  isLoading,
  folders,
  files,
  currentFolder,
  currentFolderName,
  dropTarget,
  draggedFile,
  draggedFolder,
  selectedItems,
  isDragging,
  handleFileDoubleClick,
  handleDeleteFile,
  handleDeleteFolder,
  navigateToFolder,
  setDraggedFile,
  setDraggedFolder,
  setDropTarget,
  setSelectedItems,
  openFilePicker,
  setShowNewFolderDialog,
  handleRefresh,
  handleDownloadSelected,
  handleDeleteSelected,
  supabase,
  toast,
  uploadedFiles,
  onFilesDroppedOnFolder,
  onContextMenuOpen,
  contextMenuItems,
}: FileBrowserProps) {
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const isFocusingRef = useRef(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [selectedFileForMetadata, setSelectedFileForMetadata] = useState<UploadedFile | null>(null);

  const startRenameFolder = (folderId: string, currentName: string) => {
    setRenamingFolder(folderId);
    setRenameInput(currentName);
    setDropdownOpen(null); // Close dropdown
    isFocusingRef.current = true;
    // Use a longer delay to ensure dropdown is fully closed
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
        // Force focus again after a short delay
        setTimeout(() => {
          if (renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
          }
        }, 50);
      }
      // Allow blur events after focus is complete
      setTimeout(() => {
        isFocusingRef.current = false;
      }, 300);
    }, 100);
  };

  const cancelRenameFolder = () => {
    setRenamingFolder(null);
    setRenameInput('');
  };

  const submitRenameFolder = async () => {
    if (!renamingFolder || !renameInput.trim()) {
      toast.error('Please enter a valid folder name');
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: renameInput.trim() })
        .eq('id', renamingFolder);

      if (error) throw error;

      toast.success('Folder renamed successfully');
      setRenamingFolder(null);
      setRenameInput('');

      // Refresh both folders and files
      await handleRefresh();

    } catch (error: unknown) {
      console.error('Error renaming folder:', error);
      toast.error(`Failed to rename folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (renamingFolder) {
        submitRenameFolder();
      } else if (renamingFile) {
        submitRenameFile();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (renamingFolder) {
        cancelRenameFolder();
      } else if (renamingFile) {
        cancelRenameFile();
      }
    }
  };

  const startRenameFile = (fileId: string, currentName: string) => {
    setRenamingFile(fileId);
    setRenameInput(currentName);
    setDropdownOpen(null); // Close dropdown
    isFocusingRef.current = true;
    // Use a longer delay to ensure dropdown is fully closed
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
        // Force focus again after a short delay
        setTimeout(() => {
          if (renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
          }
        }, 50);
      }
      // Allow blur events after focus is complete
      setTimeout(() => {
        isFocusingRef.current = false;
      }, 300);
    }, 100);
  };

  const cancelRenameFile = () => {
    setRenamingFile(null);
    setRenameInput('');
  };

  const submitRenameFile = async () => {
    if (!renamingFile || !renameInput.trim()) {
      toast.error('Please enter a valid file name');
      return;
    }

    try {
      const { error } = await supabase
        .from('files')
        .update({ name: renameInput.trim() })
        .eq('id', renamingFile);

      if (error) throw error;

      toast.success('File renamed successfully');
      setRenamingFile(null);
      setRenameInput('');

      // Refresh both folders and files
      await handleRefresh();

    } catch (error: unknown) {
      console.error('Error renaming file:', error);
      toast.error(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStarItem = async (itemId: string, itemType: 'file' | 'folder') => {
    try {
      if (itemType === 'file') {
        const file = uploadedFiles.find(f => f.id === itemId);
        if (file) {
          const isCurrentlyStarred = file.starred || false;
          const { error } = await supabase
            .from('files')
            .update({ starred: !isCurrentlyStarred })
            .eq('id', itemId);

          if (error) throw error;

          toast.success(isCurrentlyStarred ? `Unstarred "${file.name}"` : `Starred "${file.name}"`);
        }
      } else if (itemType === 'folder') {
        const folder = folders.find(f => f.id === itemId);
        if (folder) {
          const isCurrentlyStarred = folder.starred || false;
          const { error } = await supabase
            .from('folders')
            .update({ starred: !isCurrentlyStarred })
            .eq('id', itemId);

          if (error) throw error;

          toast.success(isCurrentlyStarred ? `Unstarred "${folder.name}"` : `Starred "${folder.name}"`);
        }
      }

      // Refresh the data
      handleRefresh();

    } catch (error: unknown) {
      console.error('Error starring item:', error);
      toast.error(`Failed to star item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOpenMetadataDialog = (file: UploadedFile) => {
    setSelectedFileForMetadata(file);
    setMetadataDialogOpen(true);
    setDropdownOpen(null); // Close dropdown
  };

  const handleSaveMetadata = async (fileId: string, metadata: AudioMetadata) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({
          bpm: metadata.bpm,
          key: metadata.key,
          genre: metadata.genre,
          mood: metadata.mood,
          artist: metadata.artist,
          year: metadata.year,
        })
        .eq('id', fileId);

      if (error) throw error;

      toast.success('Metadata saved successfully');
      await handleRefresh();
    } catch (error: unknown) {
      console.error('Error saving metadata:', error);
      toast.error(`Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let the dialog handle it
    }
  };

  return (
    <>
      <ContextMenu onOpenChange={onContextMenuOpen}>
        <ContextMenuTrigger asChild>
          <div className="h-full w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {folders.length > 0 && (
                  <div className="mb-6 pt-4">
                    <h2 className="text-lg font-medium mb-4">Folders</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {folders.map(folder => (
                        <ContextMenu key={folder.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              data-id={folder.id}
                              draggable
                              className={`relative border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${dropTarget === folder.id ? 'bg-primary/10 scale-105 border-primary shadow-lg' : ''} ${selectedItems.includes(folder.id) ? 'ring-2 ring-primary ring-offset-2' : ''} ${(draggedFolder === folder.id || (draggedFolder && draggedFolder.includes(',') && draggedFolder.split(',').includes(folder.id))) ? 'opacity-50 scale-95' : ''} folder-item`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItems(
                                  selectedItems.includes(folder.id)
                                    ? selectedItems.filter(id => id !== folder.id)
                                    : [...selectedItems, folder.id]
                                );
                              }}
                              onDoubleClick={() => navigateToFolder(folder.id)}
                              onContextMenu={(e) => e.stopPropagation()}
                              onDragStart={(e) => {
                                // If this folder is selected and there are multiple selections, drag all selected folders
                                if (selectedItems.includes(folder.id) && selectedItems.length > 1) {
                                  setDraggedFolder(selectedItems.join(',')); // Store as comma-separated string
                                } else {
                                  setDraggedFolder(folder.id);
                                }
                              }}
                              onDragEnd={() => {
                                // Only clear if this is the folder being dragged (to avoid clearing when dragging multiple folders)
                                if (draggedFolder && !draggedFolder.includes(',')) {
                                  setDraggedFolder(null);
                                } else if (draggedFolder && draggedFolder.includes(',') && selectedItems.includes(folder.id)) {
                                  // For multi-folder drag, only clear if this was the initiating folder
                                  const draggedIds = draggedFolder.split(',');
                                  if (draggedIds.includes(folder.id)) {
                                    setDraggedFolder(null);
                                  }
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedFile || draggedFolder) {
                                  setDropTarget(folder.id);
                                }
                              }}
                              onDragLeave={() => setDropTarget(null)}
                              onDrop={async (e) => {
                                e.preventDefault();
                                setDropTarget(null);

                                // Handle internal folder drag
                                if (draggedFolder) {
                                  try {
                                    // Handle multiple selected folders
                                    const folderIds = draggedFolder.includes(',') ? draggedFolder.split(',') : [draggedFolder];

                                    for (const folderId of folderIds) {
                                      await supabase.from('folders').update({ parent_id: folder.id }).eq('id', folderId);
                                    }

                                    const count = folderIds.length;
                                    toast.success(`${count} folder${count > 1 ? 's' : ''} moved successfully`);
                                    handleRefresh();
                                  } catch (error: unknown) {
                                    console.error('Error moving folders:', error);
                                    toast.error(`Failed to move folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  } finally {
                                    setDraggedFolder(null);
                                  }
                                }
                                // Handle internal file drag (existing functionality)
                                else if (draggedFile) {
                                  try {
                                    // Handle multiple selected files
                                    const fileIds = draggedFile.includes(',') ? draggedFile.split(',') : [draggedFile];

                                    for (const fileId of fileIds) {
                                      await supabase.from('files').update({ folder_id: folder.id }).eq('id', fileId);
                                    }

                                    const count = fileIds.length;
                                    toast.success(`${count} file${count > 1 ? 's' : ''} moved successfully`);
                                    handleRefresh();
                                  } catch (error: unknown) {
                                    console.error('Error moving files:', error);
                                    toast.error(`Failed to move files: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  } finally {
                                    setDraggedFile(null);
                                  }
                                }
                                // Handle external file drop (new functionality)
                                else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0 && onFilesDroppedOnFolder) {
                                  const files = Array.from(e.dataTransfer.files);
                                  // Filter for supported file types (similar to UploadWizard)
                                  const supportedFiles = files.filter(file =>
                                    file.type.startsWith('audio/') ||
                                    file.type.startsWith('image/') ||
                                    file.type.startsWith('video/') ||
                                    file.type.includes('pdf')
                                  );
                                  if (supportedFiles.length > 0) {
                                    onFilesDroppedOnFolder(supportedFiles, folder.id);
                                  } else {
                                    toast.warning('No supported file types found. Only audio, image, video, and PDF files are accepted.');
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                  <div className="flex-shrink-0">
                                    <Folder className="h-5 w-5 text-primary" />
                                  </div>
                                  {renamingFolder === folder.id ? (
                                    <Input
                                      ref={renameInputRef}
                                      value={renameInput}
                                      onChange={(e) => setRenameInput(e.target.value)}
                                      onKeyDown={handleRenameKeyPress}
                                      className="h-6 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="font-medium truncate" title={folder.name}>{folder.name}</span>
                                  )}
                                </div>
                                <DropdownMenu open={dropdownOpen === folder.id} onOpenChange={(open) => setDropdownOpen(open ? folder.id : null)}>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={renamingFolder === folder.id}
                                      tabIndex={renamingFolder === folder.id ? -1 : 0}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenameFolder(folder.id, folder.name); }}>
                                      <Pencil className="h-4 w-4 mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStarItem(folder.id, 'folder'); }}>
                                      <Star className="h-4 w-4 mr-2" /> Star
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
                              <div className="text-xs text-muted-foreground mt-auto pt-2">
                                Created {new Date(folder.created_at).toLocaleDateString()}
                              </div>
                              {dropTarget === folder.id && (
                                <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
                                  <span className="text-primary font-medium text-sm bg-background px-2 py-1 rounded">
                                    Drop files/folders here
                                  </span>
                                </div>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-64">
                            <ContextMenuItem onClick={() => toast.info("Folder download not yet implemented.")}>
                              <Download className="h-4 w-4 mr-2" /> Download Folder
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => startRenameFolder(folder.id, folder.name)}>
                              <Pencil className="h-4 w-4 mr-2" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleStarItem(folder.id, 'folder')}>
                              <Star className="h-4 w-4 mr-2" /> Star
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

                <div className="mt-4">
                  <h2 className="text-lg font-medium mb-4">
                    {currentFolder ? currentFolderName || 'Files' : 'Files'}
                  </h2>
                  {currentFolder && (
                    <div
                      className={`p-4 mb-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                        dropTarget === 'root' ? 'bg-primary/10 border-primary' : 'border-muted-foreground/25 hover:border-primary'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedFile || draggedFolder) {
                          setDropTarget('root');
                        }
                      }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDropTarget(null);
                        if (draggedFolder) {
                          try {
                            // Handle multiple selected folders
                            const folderIds = draggedFolder.includes(',') ? draggedFolder.split(',') : [draggedFolder];

                            for (const folderId of folderIds) {
                              await supabase.from('folders').update({ parent_id: null }).eq('id', folderId);
                            }

                            const count = folderIds.length;
                            toast.success(`${count} folder${count > 1 ? 's' : ''} moved back to root`);
                            handleRefresh();
                          } catch (error: unknown) {
                            console.error('Error moving folders:', error);
                            toast.error(`Failed to move folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setDraggedFolder(null);
                          }
                        }
                        else if (draggedFile) {
                          try {
                            // Handle multiple selected files
                            const fileIds = draggedFile.includes(',') ? draggedFile.split(',') : [draggedFile];

                            for (const fileId of fileIds) {
                              await supabase.from('files').update({ folder_id: null }).eq('id', fileId);
                            }

                            const count = fileIds.length;
                            toast.success(`${count} file${count > 1 ? 's' : ''} moved back to root`);
                            handleRefresh();
                          } catch (error: unknown) {
                            console.error('Error moving files:', error);
                            toast.error(`Failed to move files: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          } finally {
                            setDraggedFile(null);
                          }
                        }
                      }}
                    >
                      <div className="text-center text-sm text-muted-foreground">
                        Drop files/folders here to move back to root directory
                      </div>
                    </div>
                  )}
                  {files.length === 0 ? (
                    <div
                        className={`text-center py-12 border-2 border-dashed rounded-lg transition-all duration-300 ${
                          isDragging
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
                        }`}
                        role="presentation"
                        tabIndex={0}
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
                          openFilePicker();
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {files.map(file => (
                        <ContextMenu key={file.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              data-id={file.id}
                              draggable
                              onDragStart={(e) => {
                                // If this file is selected and there are multiple selections, drag all selected files
                                if (selectedItems.includes(file.id) && selectedItems.length > 1) {
                                  setDraggedFile(selectedItems.join(',')); // Store as comma-separated string
                                } else {
                                  setDraggedFile(file.id);
                                }
                              }}
                              onDragEnd={() => {
                                // Only clear if this is the file being dragged (to avoid clearing when dragging multiple files)
                                if (draggedFile && !draggedFile.includes(',')) {
                                  setDraggedFile(null);
                                } else if (draggedFile && draggedFile.includes(',') && selectedItems.includes(file.id)) {
                                  // For multi-file drag, only clear if this was the initiating file
                                  const draggedIds = draggedFile.split(',');
                                  if (draggedIds.includes(file.id)) {
                                    setDraggedFile(null);
                                  }
                                }
                              }}
                              className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${(draggedFile === file.id || (draggedFile && draggedFile.includes(',') && draggedFile.split(',').includes(file.id))) ? 'opacity-50 scale-95' : ''} ${selectedItems.includes(file.id) ? 'ring-2 ring-primary ring-offset-2' : ''} file-item`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItems(
                                  selectedItems.includes(file.id)
                                    ? selectedItems.filter(id => id !== file.id)
                                    : [...selectedItems, file.id]
                                );
                              }}
                              onDoubleClick={() => handleFileDoubleClick(file)}
                              onContextMenu={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                  <div className="flex-shrink-0">
                                    {getFileIcon(file.file_type)}
                                  </div>
                                  {renamingFile === file.id ? (
                                    <Input
                                      ref={renameInputRef}
                                      value={renameInput}
                                      onChange={(e) => setRenameInput(e.target.value)}
                                      onKeyDown={handleRenameKeyPress}
                                      className="h-6 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="font-medium truncate" title={file.name}>{file.name}</span>
                                  )}
                                </div>
                                <DropdownMenu open={dropdownOpen === file.id} onOpenChange={(open) => setDropdownOpen(open ? file.id : null)}>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 flex-shrink-0"
                                      disabled={renamingFile === file.id}
                                      tabIndex={renamingFile === file.id ? -1 : 0}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(file.file_url, '_blank')}>
                                      <Download className="h-4 w-4 mr-2" /> Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenameFile(file.id, file.name); }}>
                                      <Pencil className="h-4 w-4 mr-2" /> Rename
                                    </DropdownMenuItem>
                                    {file.file_type === 'audio' && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenMetadataDialog(file); }}>
                                        <Tag className="h-4 w-4 mr-2" /> Metadata
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleStarItem(file.id, 'file')}>
                                      <Star className="h-4 w-4 mr-2" /> Star
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteFile(file.id, file.file_path, file.name)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                                      <span>Format:</span>
                                      <span>{getFileFormat(file.name, file.file_path)}</span>
                                    </div>
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
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-64">
                            <ContextMenuItem onClick={() => window.open(file.file_url, '_blank')}>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => startRenameFile(file.id, file.name)}>
                              <Pencil className="h-4 w-4 mr-2" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleStarItem(file.id, 'file')}>
                              <Star className="h-4 w-4 mr-2" /> Star
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteFile(file.id, file.file_path, file.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          {contextMenuItems}
        </ContextMenuContent>
      </ContextMenu>
      <MetadataDialog
        isOpen={metadataDialogOpen}
        onOpenChange={setMetadataDialogOpen}
        file={selectedFileForMetadata}
        onSave={handleSaveMetadata}
      />
    </>
  );
}