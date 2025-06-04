import { useState, useRef } from 'react';
import { 
  File, 
  Folder, 
  Music, 
  Video, 
  FileText,
  FileImage,
  Upload
} from 'lucide-react';
import { UnifiedFileBrowser } from '@/components/upload/upload-with-browser';
import { FileItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import filesData from '../../components/upload/files.json';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const files: FileItem[] = filesData;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          toast({
            title: "Upload complete",
            description: "Your file has been uploaded successfully!",
          });
          
          return 0;
        }

        return prev + 10;
      });
    }, 400);
  };

  // Simulate drag and drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    handleFileUpload();
  };

  return (
    <div className="flex flex-col h-full">
      <UnifiedFileBrowser initialFiles={files}/>
    </div>
  );
}
