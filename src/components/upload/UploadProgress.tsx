import { Upload } from 'lucide-react';
import { Badge } from "@/components/@/ui/badge";
import { Progress } from "@/components/@/ui/progress";

interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
  fileCount: number;
}

export function UploadProgress({ isUploading, uploadProgress, fileCount }: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="py-4 bg-primary/5 border-b shadow-sm rounded-md my-2 px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <Upload className="h-4 w-4 animate-bounce text-primary" />
          </div>
          <span className="text-sm font-medium">Uploading {fileCount} file(s)...</span>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          {Math.round(uploadProgress)}%
        </Badge>
      </div>
      <Progress value={uploadProgress} className="h-2" />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>Processing files...</span>
        <span>{Math.round(uploadProgress) === 100 ? 'Complete!' : 'Uploading...'}</span>
      </div>
    </div>
  );
}
