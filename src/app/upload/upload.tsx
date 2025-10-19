import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFiles } from '@/hooks/useFiles';
import { UnifiedFileBrowser } from '@/components/upload/upload-with-browser';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FolderPlus,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/@/ui/progress';
import { FileItem } from '@/lib/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function FileManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const MAX_UPLOAD_FILES = 10;
  
  const {
    files,
    folders,
    loading,
    error,
    createFolder,
    uploadFile,
    fetchFiles,
    fetchFolders,
    deleteFile,
    deleteFolder
  } = useFiles(user?.id || '');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Check if too many files are selected
    if (e.target.files.length > MAX_UPLOAD_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${MAX_UPLOAD_FILES} files at once`,
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Initialize uploading files array
    const filesArray = Array.from(e.target.files).map(file => ({
      name: file.name,
      progress: 0
    }));
    setUploadingFiles(filesArray);
    
    try {
      const files = Array.from(e.target.files);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update overall progress
        setUploadProgress(Math.round((i / files.length) * 100));
        
        // Upload with individual file progress tracking
        await uploadFile(file, undefined, (progress) => {
          // Update individual file progress
          setUploadingFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], progress };
            return newFiles;
          });
        });
      }
      
      // Set final progress to 100%
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
      });
      
      // Refresh files
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFiles([]);
        // Clear the input value so the same file can be uploaded again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1000); // Keep progress visible briefly after completion
    }
  };


  const handleRefresh = () => {
    fetchFiles();
    fetchFolders();
    toast({
      title: "Refreshed",
      description: "File list has been refreshed"
    });
  };

  const handleDeleteSelected = async () => {
    if (!selectedFiles.length) {
      toast({
        title: "No files selected",
        description: "Please select files to delete",
        variant: "destructive"
      });
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedFiles.length} item(s)?`);
    if (!confirmDelete) return;
    
    try {
      for (const file of selectedFiles) {
        if (file.type === 'folder') {
          await deleteFolder(file.id);
        } else {
          await deleteFile(file.id, file.file_path || '');
        }
      }
      
      toast({
        title: "Deleted successfully",
        description: `${selectedFiles.length} item(s) have been deleted`
      });
      
      setSelectedFiles([]);
      fetchFiles();
      fetchFolders();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive"
      });
    }
  };

  const handleDownloadSelected = () => {
    if (!selectedFiles.length) {
      toast({
        title: "No files selected",
        description: "Please select files to download",
        variant: "destructive"
      });
      return;
    }
    
    // Only download files, not folders
    const filesToDownload = selectedFiles.filter(file => file.type !== 'folder');
    
    if (!filesToDownload.length) {
      toast({
        title: "No downloadable files",
        description: "Selected items are folders which cannot be downloaded directly",
        variant: "destructive"
      });
      return;
    }
    
    // Download each file
    filesToDownload.forEach(file => {
      if (!file.audio_url) return;
      
      const link = document.createElement('a');
      link.href = file.audio_url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    toast({
      title: "Download started",
      description: `Downloading ${filesToDownload.length} file(s)`
    });
  };

  return (
    <DashboardLayout>
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.aac"
        />
        {isUploading && (
          <div className="p-4 bg-muted/20 border rounded-lg px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Uploading files...</span>
                {uploadingFiles.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    ({uploadingFiles.length} files)
                  </span>
                )}
              </div>
              <span className="text-sm">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            {uploadingFiles.length > 1 && (
              <div className="mt-4 max-w-3xl">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="text-left">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate max-w-[80%]">{file.name}</span>
                        <span>{Math.round(file.progress)}%</span>
                      </div>
                      <Progress 
                        value={file.progress} 
                        className="h-1 bg-muted/50" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <UnifiedFileBrowser 
          files={files}
          folders={folders}
          onUpload={handleUploadClick}
          createFolder={createFolder}
          uploadFile={async (file, folderId, onProgress) => {
            try {
              await uploadFile(file, folderId, onProgress);
              return { success: true };
            } catch (error) {
              console.error('Upload error:', error);
              return { success: false };
            }
          }}
          onRefresh={handleRefresh}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleDeleteSelected}
        />
      </div>
    </DashboardLayout>
  );
}
