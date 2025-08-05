import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/@/ui/button";
import { Progress } from '@/components/@/ui/progress';
import { AlertCircle, File, Folder, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorage } from '@/contexts/storage-context';
import { supabase } from '@/lib/supabase';

interface FileManagerProps {
  className?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'audio' | 'file';
  size: string;
  modified: string;
  path: string;
  url: string;
}

export function FileManager({ className }: FileManagerProps) {
  const [isDragOverlay, setIsDragOverlay] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerStorageUpdate } = useStorage();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('audio')
        .list(user?.id || '', {
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) throw error;

      const fileItems: FileItem[] = data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.metadata?.mimetype?.startsWith('audio/') ? 'audio' : 'file',
        size: formatBytes(file.metadata?.size || 0),
        modified: new Date(file.created_at).toISOString().split('T')[0],
        path: `${user?.id}/${file.name}`,
        url: supabase.storage.from('audio').getPublicUrl(`${user?.id}/${file.name}`).data.publicUrl
      }));

      setFiles(fileItems);
    } catch (error: any) {
      toast({
        title: 'Error loading files',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpload = async (acceptedFiles: File[]) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        const filePath = `${user.id}/${file.name}`;

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));
      }

      toast({
        title: 'Success',
        description: 'Files uploaded successfully'
      });

      // Reload files and trigger storage update
      loadFiles();
      triggerStorageUpdate();
    } catch (error: any) {
      toast({
        title: 'Error uploading files',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Hide the overlay immediately when files are dropped
    setIsDragOverlay(false);
    
    if (acceptedFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload up to 10 files at once",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we have actual files (not empty folders)
    if (acceptedFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "The dropped item doesn't contain any valid audio files",
        variant: "destructive"
      });
      return;
    }
    
    handleUpload(acceptedFiles);
  }, [user?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac']
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    noClick: true, // Prevent opening file dialog on click
    noKeyboard: true, // Prevent opening file dialog on keypress
    onDragEnter: () => setIsDragOverlay(true),
    onDragLeave: () => setIsDragOverlay(false)
  });

  useEffect(() => {
    if (!user?.id) return;
    loadFiles();
  }, [user?.id]);

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative w-full p-8 text-center border-2 border-dashed rounded-lg transition-colors',
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
              {isDragActive ? 'Drop your audio files here' : 'Drag & drop audio files here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                      handleUpload(Array.from(files));
                    }
                  };
                  input.click();
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
                <p className="text-muted-foreground mt-2">Release to upload your audio files</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 ? (
        <div className="mt-8 space-y-4">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {file.type === 'audio' ? (
                  <File className="w-6 h-6 text-primary" />
                ) : (
                  <Folder className="w-6 h-6 text-primary" />
                )}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file.size} • {file.modified}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    if (!user?.id) return;
                    const { error } = await supabase.storage
                      .from('audio')
                      .remove([`${user.id}/${file.name}`]);

                    if (error) throw error;

                    toast({
                      title: 'Success',
                      description: 'File deleted successfully'
                    });

                    loadFiles();
                    triggerStorageUpdate();
                  } catch (error: any) {
                    toast({
                      title: 'Error deleting file',
                      description: error.message,
                      variant: 'destructive'
                    });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No files found</p>
          <p className="text-sm">You haven't uploaded any files yet</p>
        </div>
      )}
    </div>
  );
}
