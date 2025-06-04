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
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../@/ui/button';
import { Input } from '../@/ui/input';
import { Separator } from '../@/ui/separator';
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFileTree = (items: FileItem[], depth = 0, parentPath: string[] = []) => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(item.id);
      const currentPath = [...parentPath, item.name];
      
      return (
        <div key={item.id} style={{ paddingLeft: `${depth * 16}px` }}>
          <div 
            className={`flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
              selectedPath.join('/') === currentPath.join('/') ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
            onClick={() => {
              setSelectedPath(currentPath);
              if (isFolder) {
                toggleFolder(item.id);
              }
            }}
          >
            {isFolder && (
              <button 
                className="mr-1 w-4 h-4 flex items-center justify-center text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
            {isFolder ? (
              <Folder className="h-4 w-4 text-blue-500 mr-2" />
            ) : (
              <Music className="h-4 w-4 text-purple-500 mr-2" />
            )}
            <span className="text-sm flex-1 truncate">{item.name}</span>
            {item.size && <span className="text-xs text-gray-500">{item.size}</span>}
          </div>
          
          {isFolder && isExpanded && item.children && (
            <div className="ml-2">
              {renderFileTree(item.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full rounded-lg overflow-hidden border">
        {/* Sidebar with folders */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Favorites</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <Music className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm">All Audio</span>
              </div>
              <div className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm">Favorites</span>
              </div>
            </div>

            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Locations</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {renderFileTree(fileItems)}
            </div>
            
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-sm"
                onClick={() => setNewFolderDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {selectedPath.length > 0 ? selectedPath.join(' / ') : 'All Files'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search files..."
                  className="pl-8 h-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                  accept="audio/*"
                />
              </Button>
            </div>
          </div>

          {/* Drop area */}
          <div
            className={cn(
              "m-4 border-2 border-dashed rounded-lg p-8 text-center",
              "transition-all hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Uploading...</p>
                <div className="relative h-2 max-w-md mx-auto rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-primary" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Music className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Drag and drop audio files here</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Supported formats: MP3, WAV, AAC, FLAC, OGG, M4A
                </p>
              </div>
            )}
          </div>

          {/* File grid/list view */}
          <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* This would be populated with files from the selected folder */}
            {/* For now, just showing placeholder items */}
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Music className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm">Track {i}.wav</h4>
                  <p className="text-xs text-muted-foreground">3:45 • 24.5 MB</p>
                </div>
              </div>
            ))}
          </div>
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