import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/@/ui/dialog';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/@/ui/button';
import { Upload, X, FolderPlus, FileEdit, Folder, FileAudio, Music } from 'lucide-react';
import { Progress } from '@/components/@/ui/progress';
import { Input } from '@/components/@/ui/input';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { Label } from '@/components/@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/@/ui/select';

export interface FileWithMetadata extends File {
  id: string;
  path: string;
  name: string;
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    bpm?: number;
    key?: string;
    tags?: string[];
    description?: string;
  };
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: FileWithMetadata[]) => Promise<void>;
}

const genres = [
  'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Country',
  'Blues', 'Folk', 'Latin', 'World', 'Other'
];

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

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
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

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
        genre: '',
        bpm: undefined,
        key: '',
        tags: [],
        description: ''
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

  const updateMetadata = (fileId: string, field: keyof FileWithMetadata['metadata'], value: any) => {
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
    if (currentFileIndex >= files.length - 1) {
      setCurrentFileIndex(Math.max(0, files.length - 2));
    }
  };

  const currentFile = files[currentFileIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Upload Audio Files</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full">
          {/* File Upload Area */}
          <div className="w-1/2 flex flex-col gap-4">
            <div 
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground'
              }`}
            >
              <input {...getInputProps()} />
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your audio files here' : 'Drag & drop audio files'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: MP3, WAV, AAC, FLAC, OGG, M4A
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum 10 files
              </p>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              {files.map((file, index) => (
                <div 
                  key={file.id}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    index === currentFileIndex ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentFileIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {progress[file.id] > 0 && (
                    <Progress value={progress[file.id]} className="h-1 mt-2" />
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Metadata Editor */}
          <div className="w-1/2 border-l pl-4">
            {currentFile ? (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={currentFile.metadata.title}
                      onChange={(e) => updateMetadata(currentFile.id, 'title', e.target.value)}
                      placeholder="Track title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Artist</Label>
                    <Input
                      value={currentFile.metadata.artist}
                      onChange={(e) => updateMetadata(currentFile.id, 'artist', e.target.value)}
                      placeholder="Artist name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Album</Label>
                    <Input
                      value={currentFile.metadata.album}
                      onChange={(e) => updateMetadata(currentFile.id, 'album', e.target.value)}
                      placeholder="Album name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select
                      value={currentFile.metadata.genre}
                      onValueChange={(value) => updateMetadata(currentFile.id, 'genre', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map(genre => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BPM</Label>
                      <Input
                        type="number"
                        value={currentFile.metadata.bpm || ''}
                        onChange={(e) => updateMetadata(currentFile.id, 'bpm', parseInt(e.target.value) || undefined)}
                        placeholder="Tempo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Select
                        value={currentFile.metadata.key}
                        onValueChange={(value) => updateMetadata(currentFile.id, 'key', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Musical key" />
                        </SelectTrigger>
                        <SelectContent>
                          {musicalKeys.map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Add tags (comma separated)"
                      value={currentFile.metadata.tags?.join(', ') || ''}
                      onChange={(e) => updateMetadata(
                        currentFile.id,
                        'tags',
                        e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentFile.metadata.description}
                      onChange={(e) => updateMetadata(currentFile.id, 'description', e.target.value)}
                      placeholder="Add a description for your track..."
                    />
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select a file to edit metadata</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
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