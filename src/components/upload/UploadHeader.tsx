import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  FolderPlus,
  Upload,
} from 'lucide-react';

interface UploadHeaderProps {
  currentFolder: string | null;
  folders: any[];
  navigateToFolder: (id: string | null) => void;
  setShowNewFolderDialog: (show: boolean) => void;
  openFilePicker: () => void;
}

export function UploadHeader({
  currentFolder,
  folders,
  navigateToFolder,
  setShowNewFolderDialog,
  openFilePicker,
}: UploadHeaderProps) {
  return (
    <div className="py-6 border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="h-8 px-2"
            onClick={() => navigateToFolder(null)}
          >
            All Files
          </Button>
          {currentFolder && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button variant="ghost" className="h-8 px-2">
                {folders.find(f => f.id === currentFolder)?.name || 'Folder'}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowNewFolderDialog(true)}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        <Button variant="default" onClick={openFilePicker}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>
    </div>
  );
}
