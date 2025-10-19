import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/auth-context';
import {
  Upload,
  FileIcon,
  Star,
  Download,
  MoreHorizontal,
  Folder,
  Home,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../@/ui/button';
import { cn } from '../@/lib/utils';
import { useToast } from '../../hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../@/ui/dropdown-menu';
import { Progress } from '../@/ui/progress';
import { FileItem } from '@/lib/types';

// Simple file browser without sidebar
export function SimpleFileBrowser({
  files: propFiles,
  folders: propFolders,
  onFileDoubleClick,
  selectedFiles = [],
  onFileSelect,
  showUpload = true,
  showDragDrop = true
}: {
  files?: FileItem[];
  folders?: FileItem[];
  onFileDoubleClick?: (file: FileItem) => void;
  selectedFiles?: string[];
  onFileSelect?: (file: FileItem) => void;
  showUpload?: boolean;
  showDragDrop?: boolean;
}) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>(propFiles || []);
  const [folders, setFolders] = useState<FileItem[]>(propFolders || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FileItem[]>([]);
  const MAX_UPLOAD_FILES = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle folder navigation
  const navigateToFolder = (folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folderId);
        setFolderPath(prev => [...prev, folder]);
      }
    }
  };

  const goBack = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);

      if (newPath.length === 0) {
        setCurrentFolder(null);
      } else {
        setCurrentFolder(newPath[newPath.length - 1].id);
      }
    }
  };

  // Filter files and folders based on current folder
  const getCurrentFiles = () => {
    if (!currentFolder) {
      return files.filter(file => !file.folder_id); // Root level files
    }
    return files.filter(file => file.folder_id === currentFolder);
  };

  const getCurrentFolders = () => {
    if (!currentFolder) {
      return folders.filter(folder => !folder.folder_id); // Root level folders
    }
    return folders.filter(folder => folder.folder_id === currentFolder);
  };

  // Update files when propFiles changes
  useEffect(() => {
    if (propFiles) {
      setFiles(propFiles);
    }
  }, [propFiles]);

  // Update folders when propFolders changes
  useEffect(() => {
    if (propFolders) {
      setFolders(propFolders);
    }
  }, [propFolders]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    if (droppedFiles.length > MAX_UPLOAD_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${MAX_UPLOAD_FILES} files at once`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    // Initialize uploading files array
    const filesArray = Array.from(droppedFiles).map(file => ({
      name: file.name,
      progress: 0
    }));
    setUploadingFiles(filesArray);

    try {
      // Process each file sequentially
      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i];
        try {
          await uploadFile(file, currentFolder, (progress) => {
            setUploadingFiles(prev => {
              const newFiles = [...prev];
              newFiles[i] = { ...newFiles[i], progress };
              return newFiles;
            });
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${droppedFiles.length} file${droppedFiles.length > 1 ? 's' : ''}`,
      });

    } finally {
      setIsUploading(false);
      setUploadingFiles([]);
    }
  };

  const uploadFile = async (
    file: File,
    folderId?: string | null,
    onProgress?: (progress: number) => void
  ) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "User not authenticated. Please log in to upload files.",
          variant: "destructive"
        });
        throw new Error("User not authenticated");
      }

      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${fileId}.${fileExt}`;

      const { error } = await supabase.storage
        .from('audio_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
        if (onProgress) onProgress(progress);
      }, 300);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('audio_files')
        .getPublicUrl(filePath);

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
          folder_id: folderId || null
        }]);

      if (dbError) throw dbError;

      return { success: true, fileId, url: publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  function getFileType(mimeType: string): string {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'document';
    return 'file';
  }

  const downloadFile = (file: FileItem) => {
    if (!file.audio_url) {
      toast({
        title: "Download failed",
        description: "File URL is not available",
        variant: "destructive"
      });
      return;
    }

    const link = document.createElement('a');
    link.href = file.audio_url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${file.name}`
    });
  };

  const currentFiles = getCurrentFiles();
  const currentFolders = getCurrentFolders();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Folder Navigation */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          {folderPath.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant={currentFolder === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigateToFolder(null)}
            className="h-8 gap-1"
            >
            <Home className="h-3 w-3" />
            <span className="text-sm">All Files</span>
          </Button>

          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Button
                variant={index === folderPath.length - 1 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigateToFolder(folder.id)}
                className="h-8"
              >
                <span className="text-sm">{folder.name}</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 h-full w-full">
        {/* Display folders and files in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Current folders */}
          {currentFolders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                "p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer",
                "hover:shadow-md hover:bg-primary/5"
              )}
              onDoubleClick={() => navigateToFolder(folder.id)}
            >
              <div className="p-2 bg-blue-100 rounded-md">
                <Folder className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{folder.name}</p>
                <p className="text-xs text-muted-foreground">Folder</p>
              </div>
            </div>
          ))}

          {/* Current files */}
          {currentFiles.map((file) => {
            const isSelected = selectedFiles.includes(file.id);
            return (
              <div
                key={file.id}
                className={cn(
                  "p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer",
                  "hover:shadow-md hover:bg-primary/5",
                  isSelected && "bg-primary/10 border-primary shadow-sm"
                )}
                onClick={() => onFileSelect?.(file)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onFileDoubleClick?.(file);
                }}
              >
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium truncate">{file.name}</p>
                    {file.starred && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.modified}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file);
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        {/* Enhanced drag and drop upload area */}
        {showDragDrop && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center",
              "transition-all mt-4",
              isDragActive ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="text-left">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate max-w-[80%]">{file.name}</span>
                        <span>{Math.round(file.progress)}%</span>
                      </div>
                      <Progress
                        value={file.progress}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? 'Drop your files here' : 'Drag and drop audio files here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum {MAX_UPLOAD_FILES} files at once
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
