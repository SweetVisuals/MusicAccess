import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";
import { UploadedFile } from '@/lib/types';

interface FileBrowserProps {
  isLoading: boolean;
  folders: any[];
  files: UploadedFile[];
  currentFolder: string | null;
  dropTarget: string | null;
  draggedFile: string | null;
  selectedItems: string[];
  isDragging: boolean;
  handleFileDoubleClick: (file: UploadedFile) => void;
  handleDeleteFile: (id: string, filePath: string | null, name: string) => void;
  handleDeleteFolder: (id: string, name: string) => void;
  navigateToFolder: (id: string | null) => void;
  setDraggedFile: (id: string | null) => void;
  setDropTarget: (id: string | null) => void;
  setSelectedItems: (items: string[]) => void;
  openFilePicker: () => void;
  setShowNewFolderDialog: (show: boolean) => void;
  handleRefresh: () => void;
  handleDownloadSelected: () => void;
  handleDeleteSelected: () => void;
  supabase: any; // Pass supabase client for file moving
  fetchFiles: () => void;
  toast: any;
}

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

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileBrowser({
  isLoading,
  folders,
  files,
  currentFolder,
  dropTarget,
  draggedFile,
  selectedItems,
  isDragging,
  handleFileDoubleClick,
  handleDeleteFile,
  handleDeleteFolder,
  navigateToFolder,
  setDraggedFile,
  setDropTarget,
  setSelectedItems,
  openFilePicker,
  setShowNewFolderDialog,
  handleRefresh,
  handleDownloadSelected,
  handleDeleteSelected,
  supabase,
  fetchFiles,
  toast,
}: FileBrowserProps) {
  return (
    <ContextMenu onOpenChange={(open) => {
      if (open) {
        const targetElement = event?.target as HTMLElement | undefined;
        if (targetElement) {
          const isFileOrFolderClick = targetElement.closest('.file-item') || targetElement.closest('.folder-item');
          if (!isFileOrFolderClick) {
            setSelectedItems([]);
          }
        }
      }
    }}>
      <ContextMenuTrigger asChild>
        <div className="h-full w-full" style={{ maxWidth: 'none', width: '100%' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {folders.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-4">Folders</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {folders.map(folder => (
                      <ContextMenu key={folder.id}>
                        <ContextMenuTrigger asChild>
                          <div 
                            data-id={folder.id}
                            className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${dropTarget === folder.id ? 'bg-primary/10 scale-105 border-primary' : ''} ${selectedItems.includes(folder.id) ? 'ring-2 ring-primary ring-offset-2' : ''} folder-item`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItems(
                                selectedItems.includes(folder.id) 
                                  ? selectedItems.filter(id => id !== folder.id) 
                                  : [...selectedItems, folder.id]
                              );
                            }}
                            onDoubleClick={() => navigateToFolder(folder.id)}
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
                                } catch (error: unknown) {
                                  console.error('Error moving file:', error);
                                  toast.error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Rename */ }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Star */ }}>
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
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-64">
                          <ContextMenuItem onClick={() => toast.info("Folder download not yet implemented.")}>
                            <Download className="h-4 w-4 mr-2" /> Download Folder
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => { /* Rename */ }}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => { /* Star */ }}>
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

              <div>
                <h2 className="text-lg font-medium mb-4">
                  {currentFolder ? folders.find(f => f.id === currentFolder)?.name || 'Files' : 'Files'}
                </h2>
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
                            onDragStart={() => setDraggedFile(file.id)}
                            onDragEnd={() => setDraggedFile(null)}
                            className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${draggedFile === file.id ? 'opacity-50 scale-95' : ''} ${selectedItems.includes(file.id) ? 'ring-2 ring-primary ring-offset-2' : ''} file-item`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItems(
                                selectedItems.includes(file.id) 
                                  ? selectedItems.filter(id => id !== file.id) 
                                  : [...selectedItems, file.id]
                              );
                            }}
                            onDoubleClick={() => handleFileDoubleClick(file)}
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
                                  <DropdownMenuItem onClick={() => window.open(file.file_url, '_blank')}>
                                    <Download className="h-4 w-4 mr-2" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { /* Rename */ }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { /* Star */ }}>
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
                          <ContextMenuItem onClick={() => { /* Rename */ }}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => { /* Star */ }}>
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
        <ContextMenuItem onClick={openFilePicker}>
          <Upload className="h-4 w-4 mr-2" /> Upload Files
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setShowNewFolderDialog(true)}>
          <FolderPlus className="h-4 w-4 mr-2" /> New Folder
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </ContextMenuItem>
        <ContextMenuSeparator />
        {selectedItems.length > 0 && (
          <>
            <ContextMenuItem onClick={handleDownloadSelected}>
              <Download className="h-4 w-4 mr-2" /> Download Selected
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDeleteSelected} className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
            </ContextMenuItem>
          </> 
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
