import { useState, useCallback, useRef } from 'react';
import { FileManager } from './file-manager';
import { 
  File, 
  Folder, 
  Music, 
  Video, 
  FileText,
  FileImage,
  MoreVertical,
  Plus,
  Search,
  Upload,
  Tag,
  Pin,
  Star
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

interface UnifiedFileBrowserProps {
  initialFiles: FileItem[];
}

const demoFiles: FileItem[] = [
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: 'Work',
        type: 'folder',
        children: [
          { id: '1-1-1', name: 'Project1.pdf', type: 'file' },
          { id: '1-1-2', name: 'Project2.pdf', type: 'file' }
        ]
      },
      {
        id: '1-2',
        name: 'Personal',
        type: 'folder',
        children: [
          { id: '1-2-1', name: 'Resume.pdf', type: 'file' },
          { id: '1-2-2', name: 'Notes.txt', type: 'file' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Music',
    type: 'folder',
    children: [
      {
        id: '2-1',
        name: 'Albums',
        type: 'folder',
        children: [
          { id: '2-1-1', name: 'Album1.mp3', type: 'file' },
          { id: '2-1-2', name: 'Album2.mp3', type: 'file' }
        ]
      },
      {
        id: '2-2',
        name: 'Playlists',
        type: 'folder',
        children: [
          { id: '2-2-1', name: 'Workout.m3u', type: 'file' },
          { id: '2-2-2', name: 'Relax.m3u', type: 'file' }
        ]
      }
    ]
  },
  { id: '3', name: 'README.md', type: 'file' }
];

export function UnifiedFileBrowser({ initialFiles = demoFiles }: UnifiedFileBrowserProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'audio' | 'video' | 'image' | 'document'>('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  // File operations
  const updateItemById = (items: FileItem[], id: string, updater: (item: FileItem) => FileItem): FileItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return updater(item)
      }
      if (item.children) {
        return {
          ...item,
          children: updateItemById(item.children, id, updater)
        }
      }
      return item
    })
  }

  const handleTagAdd = (id: string) => {
    setCurrentItemId(id);
    setTagDialogOpen(true);
  };

  const confirmTagAdd = () => {
    if (tagInput.trim()) {
      setFileItems(prevItems => 
        updateItemById(prevItems, currentItemId, item => ({
          ...item,
          tags: [...(item.tags || []), tagInput.trim()],
          badge: {
            variant: 'secondary',
            label: tagInput.trim(),
            color: selectedColor
          }
        }))
      );
      setTagInput('');
      setSelectedColor('blue');
      setTagDialogOpen(false);
    }
  };

  const handlePinToggle = (id: string) => {
    setFileItems(prevItems => 
      updateItemById(prevItems, id, item => ({
        ...item,
        pinned: !item.pinned
      }))
    );
  };

  const handleStarToggle = (id: string) => {
    setFileItems(prevItems => 
      updateItemById(prevItems, id, item => ({
        ...item,
        starred: !item.starred
      }))
    );
  };

  // Drag and drop functionality
  const moveItem = useCallback((
    dragIndex: number,
    hoverIndex: number,
    columnIndex: number
  ) => {
    setFileItems(prevItems => {
      if (columnIndex > 0) {
        const path = selectedPath.slice(0, columnIndex);
        let current = [...prevItems];
        let parent = null;
        
        for (const segment of path) {
          parent = current.find(item => item.name === segment);
          if (!parent || !parent.children) return prevItems;
          current = parent.children;
        }

        const newChildren = [...current];
        const [removed] = newChildren.splice(dragIndex, 1);
        newChildren.splice(hoverIndex, 0, removed);

        if (parent) {
          parent.children = newChildren;
        }

        return [...prevItems];
      } else {
        const newItems = [...prevItems];
        const [removed] = newItems.splice(dragIndex, 1);
        newItems.splice(hoverIndex, 0, removed);
        return newItems;
      }
    });
  }, [selectedPath]);

  const getCurrentItems = (path: string[] = selectedPath) => {
    let current: FileItem[] = fileItems;
    
    // Navigate to current path
    for (const segment of path) {
      const found = current.find(item => item.name === segment);
      if (found && found.children) {
        current = found.children;
      } else {
        return [];
      }
    }
    return current;
  };

  const handleItemClick = (itemName: string, columnIndex: number) => {
    if (columnIndex < selectedPath.length) {
      // Clicked on an item in an existing column - update path
      const newPath = selectedPath.slice(0, columnIndex);
      newPath.push(itemName);
      setSelectedPath(newPath);
    } else {
      // Clicked on a folder in the last column - append to path
      setSelectedPath([...selectedPath, itemName]);
    }
  };

  // Upload functionality
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
            description: "Your file has been uploaded successfully!",
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

  // Draggable item component
  const DraggableItem = ({ item, index, columnIndex, moveItem, children }: {
    item: FileItem
    index: number
    columnIndex: number
    moveItem: (dragIndex: number, hoverIndex: number, columnIndex: number) => void
    children: React.ReactNode
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: 'ITEM',
      item: { index, columnIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'ITEM',
      hover: (draggedItem: { index: number; columnIndex: number }) => {
        if (draggedItem.index !== index || draggedItem.columnIndex !== columnIndex) {
          moveItem(draggedItem.index, index, columnIndex);
          draggedItem.index = index;
        }
      },
    });

    drag(drop(ref));

    return (
      <div
        ref={ref}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className="draggable-item"
      >
        {children}
      </div>
    );
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 h-full">
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
              />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
          </div>

          <Separator />

          <div className="space-y-1">
            <Button 
              variant={activeFilter === 'all' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveFilter('all')}
            >
              <File className="h-4 w-4" />
              <span>All Files</span>
            </Button>
            <Button 
              variant={activeFilter === 'audio' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveFilter('audio')}
            >
              <Music className="h-4 w-4" />
              <span>Audio</span>
            </Button>
            <Button 
              variant={activeFilter === 'video' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveFilter('video')}
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </Button>
            <Button 
              variant={activeFilter === 'image' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveFilter('image')}
            >
              <FileImage className="h-4 w-4" />
              <span>Images</span>
            </Button>
            <Button 
              variant={activeFilter === 'document' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={() => setActiveFilter('document')}
            >
              <FileText className="h-4 w-4" />
              <span>Documents</span>
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
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">Files</h1>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg m-4 p-4 text-center",
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
                    className="absolute top-0 left-0 h-full rounded-full" 
                    style={{ width: `${uploadProgress}%`, backgroundColor: '#3b82f6' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here or{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={handleUploadClick}>
                    browse
                  </Button>
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <FileManager 
              key={`${activeFilter}-${selectedPath.join('/')}`}
              initialFiles={getCurrentItems()} 
              onItemClick={handleItemClick}
              currentPath={selectedPath}
              activeFilter={activeFilter}
            />
          </div>
        </div>
      </div>

      {/* Tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Tag Name
              </label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Tag Color
              </label>
              <div className="flex gap-2">
                {['blue', 'green', 'red', 'yellow', 'purple', 'pink'].map(color => (
                  <button
                    key={color}
                    className={`h-6 w-6 rounded-full bg-${color}-500 hover:ring-2 hover:ring-${color}-300 ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-white ring-' + color + '-300' : ''
                    }`}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmTagAdd}>
                Add Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}
