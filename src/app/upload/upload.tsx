import { useState, useRef } from 'react';
import { 
  File, 
  Music, 
  Video, 
  FileText,
  FileImage,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/@/ui/button';
import { Progress } from '@/components/@/ui/progress';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
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
            description: "Your files have been uploaded successfully!",
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
      <div
        className="border-2 border-dashed rounded-lg m-4 p-4 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Uploading...</p>
            <Progress value={uploadProgress} />
            <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Drag and drop files here or{" "}
              <Button variant="link" className="p-0 h-auto" onClick={handleUploadClick}>
                browse
              </Button>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />
          </div>
        )}
      </div>
    </div>
  );
}