import { useState, useCallback, useRef } from 'react';
import { FileManager } from './file-manager';
import { 
  File, 
  Folder, 
  Music, 
  Plus,
  Search,
  Upload,
  Tag,
  Pin,
  Star,
  MoreVertical,
  X
} from 'lucide-react';
import { Button } from '../@/ui/button';
import { Input } from '../@/ui/input';
import { Separator } from '../@/ui/separator';
import { Progress } from '../@/ui/progress';
import { cn } from '../@/lib/utils';
import { useToast } from '../../hooks/use-toast';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../@/ui/dialog';
import { FileItem } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../@/ui/dropdown-menu';

interface UnifiedFileBrowserProps {
  initialFiles: FileItem[];
}

const demoFiles: FileItem[] = [
  {
    id: '1',
    name: 'Album Projects',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: 'Summer EP',
        type: 'folder',
        children: [
          { id: '1-1-1', name: 'Track 1.wav', type: 'audio', size: '24.5 MB' },
          { id: '1-1-2', name: 'Track 2.wav', type: 'audio', size: '18.2 MB' }
        ]
      },
      {
        id: '1-2',
        name: 'Winter Album',
        type: 'folder',
        children: [
          { id: '1-2-1', name: 'Intro.mp3', type: 'audio', size: '8.4 MB' },
          { id: '1-2-2', name: 'Main Theme.wav', type: 'audio', size: '32.1 MB' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Collaborations',
    type: 'folder',
    children: [
      {
        id: '2-1',
        name: 'With John',
        type: 'folder',
        children: [
          { id: '2-1-1', name: 'Vocals.wav', type: 'audio', size: '45.2 MB' },
          { id: '2-1-2', name: 'Final Mix.wav', type: 'audio', size: '52.8 MB' }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Stems',
    type: 'folder',
    children: [
      { id: '3-1', name: 'Drums.wav', type: 'audio', size: '28.6 MB' },
      { id: '3-2', name: 'Bass.wav', type: 'audio', size: '15.3 MB' },
      { id: '3-3', name: 'Synths.wav', type: 'audio', size: '22.1 MB' }
    ]
  }
];

export function UnifiedFileBrowser({ initialFiles = demoFiles }: UnifiedFileBrowserProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FileItem = {
      id: Math.random().toString(36).substring(2),
      name: newFolderName.trim(),
      type: 'folder',
      children: []
    };

    let current = fileItems;
    for (const pathSegment of currentPath) {
      const folder = current.find(item => item.name === pathSegment);
      if (folder && folder.children) {
        current = folder.children;
      }
    }

    current.push(newFolder);
    setFileItems([...fileItems]);
    setNewFolderName('');
    setNewFolderDialogOpen(false);

    toast({
      title: "Folder created",
      description: `Created folder "${newFolderName}"`,
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
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
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Sidebar with filters */}
        <div className="w-64 space-y-4 p-4 border-r">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              className="pl-8"
            />
          </div>

          <div>
            <Button
              className="w-full justify-start gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                multiple
                accept="audio/*"
              />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2 mt-2"
              onClick={() => setNewFolderDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
          </div>

          <Separator />

          <div className="space-y-1">
            <Button 
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Music className="h-4 w-4" />
              <span>All Audio Files</span>
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Storage</h3>
            <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full" 
                style={{ width: '68%', backgroundColor: '#3b82f6' }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              6.8 GB of 10 GB used
            </p>
          </div>
        </div>

        {/* Main file browser area */}
        <div className="flex-1 flex flex-col">
          <FileManager 
            initialFiles={fileItems}
            onItemClick={(itemName, columnIndex) => {
              const newPath = currentPath.slice(0, columnIndex);
              newPath.push(itemName);
              setCurrentPath(newPath);
            }}
            currentPath={currentPath}
          />
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}