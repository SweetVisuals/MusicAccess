import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/@/ui/dialog';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/@/ui/button';
import { Upload, X, FolderPlus, FileEdit, Folder, FileAudio } from 'lucide-react';
import { Progress } from '@/components/@/ui/progress';
import { Input } from '@/components/@/ui/input';
import { ScrollArea } from '@/components/@/ui/scroll-area';

export interface FileWithMetadata extends File {
  id: string;
  path: string;
  name: string;
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: FileWithMetadata[]) => Promise<void>;
}

export const UploadDialog = ({ open, onOpenChange, onUpload }: UploadDialogProps) => {
  useEffect(() => {
    const handleOpenDialog = () => {
      onOpenChange(true);
    };

    window.addEventListener('open-upload-dialog', handleOpenDialog);
    return () => {
      window.removeEventListener('open-upload-dialog', handleOpenDialog);
    };
  }, [onOpenChange]);

  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > 10) {
      acceptedFiles = acceptedFiles.slice(0, 10 - files.length);
    }

    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(2, 9),
      path: currentFolder,
      name: file.name,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: '',
        album: '',
        genre: ''
      }
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, currentFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a']
    },
    maxFiles: 10,
    multiple: true
  });

  const handleUpload = async () => {
    setIsUploading(true);
    const progressTracker: Record<string, number> = {};
    
    // Simulate progress for each file
    files.forEach(file => {
      progressTracker[file.id] = 0;
      const interval = setInterval(() => {
        progressTracker[file.id] = Math.min(progressTracker[file.id] + 10, 100);
        setProgress({...progressTracker});
        if (progressTracker[file.id] === 100) {
          clearInterval(interval);
        }
      }, 300);
    });

    try {
      await onUpload(files);
      onOpenChange(false);
      setFiles([]);
      setCurrentFolder('');
    } finally {
      setIsUploading(false);
    }
  };

  const createFolder = () => {
    const folderName = prompt('Enter folder name');
    if (folderName) {
      setCurrentFolder(folderName);
    }
  };

  const updateMetadata = (fileId: string, field: keyof FileWithMetadata['metadata'], value: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, metadata: { ...file.metadata, [field]: value } } 
        : file
    ));
  };

  const updateFilename = (fileId: string, newName: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, name: newName } 
        : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const filesInCurrentFolder = useMemo(() => 
    files.filter(file => file.path === currentFolder),
    [files, currentFolder]
  );

  const folders = useMemo(() => 
    Array.from(new Set(files.map(file => file.path))),
    [files]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Audio Files</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4">
          <div className="w-1/3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Folders</h3>
              <button 
                onClick={createFolder}
                className="p-1 rounded hover:bg-muted"
                title="Create folder"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea className="h-64 border rounded">
              <div 
                className={`p-2 cursor-pointer ${!currentFolder ? 'bg-muted' : ''}`}
                onClick={() => setCurrentFolder('')}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>Root</span>
                </div>
              </div>
              {folders.map(folder => (
                <div 
                  key={folder}
                  className={`p-2 cursor-pointer ${currentFolder === folder ? 'bg-muted' : ''}`}
                  onClick={() => setCurrentFolder(folder)}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>{folder}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="w-2/3">
            <div 
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mb-4 ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                {isDragActive 
                  ? 'Drop audio files here' 
                  : 'Drag & drop audio files here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10 files (MP3, WAV, AAC, FLAC, OGG, M4A)
              </p>
            </div>

            {filesInCurrentFolder.length > 0 && (
              <ScrollArea className="h-64 border rounded p-2">
                {filesInCurrentFolder.map(file => (
                  <div key={file.id} className="mb-4 last:mb-0 border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <FileAudio className="h-5 w-5 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Input
                            value={file.name}
                            onChange={(e) => updateFilename(file.id, e.target.value)}
                            className="h-8"
                          />
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <label className="text-xs text-muted-foreground">Title</label>
                            <Input
                              value={file.metadata.title}
                              onChange={(e) => updateMetadata(file.id, 'title', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Artist</label>
                            <Input
                              value={file.metadata.artist}
                              onChange={(e) => updateMetadata(file.id, 'artist', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Album</label>
                            <Input
                              value={file.metadata.album}
                              onChange={(e) => updateMetadata(file.id, 'album', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Genre</label>
                            <Input
                              value={file.metadata.genre}
                              onChange={(e) => updateMetadata(file.id, 'genre', e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        {progress[file.id] > 0 && (
                          <div className="mt-2">
                            <Progress value={progress[file.id]} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            {files.length} / 10 files selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
