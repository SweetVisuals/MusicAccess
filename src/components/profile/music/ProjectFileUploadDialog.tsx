import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/@/ui/dialog';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/@/ui/button';
import { Upload, X, FileMusic, Music, File as FileIcon, Folder, ChevronRight, Download } from 'lucide-react';
import { Progress } from '@/components/@/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/@/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  metadata: {
    title?: string;
    description?: string;
    type?: string;
  };
  preview?: string;
  file_url?: string;
  file_type?: string;
  lastModified?: number;
  webkitRelativePath?: string;
}

interface ProjectFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUploadComplete: () => void;
}

export const ProjectFileUploadDialog = ({ 
  open, 
  onOpenChange, 
  projectId, 
  onUploadComplete 
}: ProjectFileUploadDialogProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<Record<string, { title: string; description: string; allow_download: boolean }>>({});
  const [folders, setFolders] = useState<any[]>([]);
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<ProjectFile[]>([]);

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

  const fetchFiles = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
      
      if (currentFolder) {
        query = query.eq('folder_id', currentFolder)
      } else {
        query = query.is('folder_id', null)
      }

      const { data, error } = await query;

      if (error) throw error;
      setUserFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchFolders();
      fetchFiles();
    }
  }, [open, user, currentFolder]);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setFiles([]);
      setProgress({});
      setIsUploading(false);
      setCurrentFolder(null);
      setSelectedFiles([]);
    }
  }, [open]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileId = uuidv4();
      const fileType = getFileType(file.type);
      const title = file.name.replace(/\.[^/.]+$/, "");

      setFileMetadata(prev => ({
        ...prev,
        [fileId]: { title, description: '', allow_download: false }
      }));

      return {
        ...file,
        id: fileId,
        path: '',
        metadata: { title, description: '', type: fileType },
        preview: file.type.startsWith('audio/') ? undefined : URL.createObjectURL(file),
        file_url: undefined,
        file_type: fileType
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'document';
    return 'other';
  };

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.mov', '.avi']
    }
  });

  const updateFileMetadata = (fileId: string, field: 'title' | 'description' | 'allow_download', value: string | boolean) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setFileMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[fileId];
      return newMetadata;
    });
  };

  const toggleFileSelection = (file: any) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        const projectFile: ProjectFile = {
          id: file.id,
          name: file.name,
          path: file.file_path,
          size: file.size,
          type: file.file_type,
          metadata: {
            title: file.name,
            description: file.description || '',
            type: getFileType(file.file_type)
          },
          file_url: file.file_url,
          file_type: getFileType(file.file_type)
        };
        return [...prev, projectFile];
      }
    });
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    const filesToUpload = [...files, ...selectedFiles.filter(sf => !files.some(f => f.id === sf.id))];
    if (filesToUpload.length === 0) {
      toast.error('Please select files to upload or add from your library');
      return;
    }

    setIsUploading(true);
    setProgress({});

    try {
      for (const file of filesToUpload) {
        const isNewUpload = !file.file_url;
        let fileId = isNewUpload ? uuidv4() : file.id;
        let fileUrl = file.file_url;
        
        if (isNewUpload) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${fileId}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('audio_files')
            .upload(filePath, file as unknown as File, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('audio_files').getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
          
          const { error: dbError } = await supabase.from('files').insert({
            id: fileId,
            name: file.name,
            file_url: urlData.publicUrl,
            file_path: filePath,
            size: file.size,
            file_type: getFileType(file.type),
            user_id: user.id,
            folder_id: currentFolder,
          });

          if (dbError) throw dbError;
        }

        const { error: metadataError } = await supabase
          .from('project_files')
          .insert({
            project_id: projectId,
            file_id: fileId,
          });

        if (metadataError) throw metadataError;

        // If it's an audio file, also add it to the tracks table
        if (file.file_type === 'audio') {
          const metadata = fileMetadata[file.id] || { title: file.name, description: '', allow_download: false };
          const { error: trackError } = await supabase
            .from('tracks')
            .insert({
              project_id: projectId,
              title: metadata.title,
              audio_url: fileUrl,
              allow_download: metadata.allow_download,
              user_id: user.id,
            });

          if (trackError) {
            console.error('Error creating track:', trackError);
            toast.error(`Failed to create track for ${metadata.title}`);
          }
        }
      }

      toast.success(`${filesToUpload.length} file${filesToUpload.length !== 1 ? 's' : ''} linked successfully`);
      onOpenChange(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <FileMusic className="h-12 w-12 text-primary" />;
      case 'image':
        return <FileIcon className="h-12 w-12 text-blue-500" />;
      case 'video':
        return <FileIcon className="h-12 w-12 text-purple-500" />;
      case 'document':
        return <FileIcon className="h-12 w-12 text-orange-500" />;
      default:
        return <FileIcon className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add Files to Project
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
              <TabsTrigger value="library">From Library</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div 
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to select
                </p>
              </div>
              {files.length > 0 && (
                <ScrollArea className="h-64 border rounded-md p-4 mt-4">
                  <div className="space-y-4">
                    {files.map(file => (
                      <div key={file.id} className="bg-muted/50 rounded-lg p-3 relative">
                        <Button
                          variant="destructive"
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 rounded-full"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.metadata.type || 'other')}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input 
                              value={fileMetadata[file.id]?.title || ''}
                              onChange={(e) => updateFileMetadata(file.id, 'title', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Enter a title"
                            />
                            <Textarea 
                              value={fileMetadata[file.id]?.description || ''}
                              onChange={(e) => updateFileMetadata(file.id, 'description', e.target.value)}
                              className="text-sm"
                              placeholder="Add a description"
                              rows={2}
                            />
                            {file.metadata.type === 'audio' && (
                              <div className="flex items-center justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${fileMetadata[file.id]?.allow_download ? 'text-green-500' : ''}`}
                                  onClick={() => updateFileMetadata(file.id, 'allow_download', !fileMetadata[file.id]?.allow_download)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            <TabsContent value="library">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Button variant="ghost" size="sm" onClick={() => setCurrentFolder(null)}>
                  All Files
                </Button>
                <ChevronRight className="h-4 w-4" />
                {/* Breadcrumbs would go here */}
              </div>
              <ScrollArea className="h-72 mt-2 border rounded-md">
                <div className="p-4 grid grid-cols-3 gap-4">
                  {folders.map(folder => (
                    <div key={folder.id} onDoubleClick={() => setCurrentFolder(folder.id)} className="p-4 border rounded-md cursor-pointer hover:bg-muted/50 flex flex-col items-center justify-center">
                      <Folder className="h-12 w-12 text-primary" />
                      <span className="mt-2 text-sm text-center">{folder.name}</span>
                    </div>
                  ))}
                  {userFiles.map(file => (
                    <div key={file.id} onClick={() => toggleFileSelection(file)} className={`p-4 border rounded-md cursor-pointer hover:bg-muted/50 flex flex-col items-center justify-center ${selectedFiles.some(f => f.id === file.id) ? 'bg-primary/10 border-primary' : ''}`}>
                      {getFileIcon(file.file_type)}
                      <span className="mt-2 text-sm text-center">{file.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={(files.length === 0 && selectedFiles.length === 0) || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? 'Processing...' : `Add ${files.length + selectedFiles.length} File(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFileUploadDialog;
