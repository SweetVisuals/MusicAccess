import { useState, useEffect } from 'react';
import { File, Folder, ChevronRight, MoreVertical, Star, Pin, Tag, Trash2, Pencil, Music, ChevronDown } from 'lucide-react';
import { Button } from '../@/ui/button';
import { Badge } from '../@/ui/badge';
import { cn } from '../@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../@/ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size?: string;
  modified?: string;
  children?: FileItem[];
  pinned?: boolean;
  starred?: boolean;
  badge?: {
    variant: string;
    label: string;
  };
}

interface DraggableItem {
  id: string;
  index: number;
  type: string;
}

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder'
};

interface FileManagerProps {
  className?: string;
  initialFiles?: FileItem[];
  onItemClick?: (itemName: string, columnIndex: number) => void;
  currentPath?: string[];
  activeFilter?: 'all' | 'audio' | 'video' | 'image' | 'document';
}

export function FileManager({ className, initialFiles = [], onItemClick, currentPath = [], activeFilter = 'all' }: FileManagerProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>(currentPath);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileItems, setFileItems] = useState<FileItem[]>(initialFiles);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>(initialFiles);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const filterFiles = (items: FileItem[]): FileItem[] => {
      if (activeFilter === 'all') return items;
      
      return items
        .map(item => {
          if (item.type === 'folder' && item.children) {
            const filteredChildren = filterFiles(item.children);
            return filteredChildren.length > 0 
              ? { ...item, children: filteredChildren } 
              : null;
          }
          
          if (item.type === 'file' || item.type === 'audio') {
            const ext = item.name.split('.').pop()?.toLowerCase();
            switch (activeFilter) {
              case 'audio':
                return ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext!) ? item : null;
              default:
                return item;
            }
          }
          return item;
        })
        .filter(Boolean) as FileItem[];
    };
    
    setFilteredFiles(filterFiles(initialFiles));
  }, [initialFiles, activeFilter]);

  const updateItemById = (items: FileItem[], id: string, updater: (item: FileItem) => FileItem): FileItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return updater(item);
      }
      if (item.children) {
        return {
          ...item,
          children: updateItemById(item.children, id, updater)
        };
      }
      return item;
    });
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
      const currentItemPath = [...parentPath, item.name];
      
      return (
        <div key={item.id} style={{ paddingLeft: `${depth * 16}px` }}>
          <div 
            className={`flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
              selectedPath.join('/') === currentItemPath.join('/') ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
            onClick={() => {
              setSelectedPath(currentItemPath);
              if (isFolder) {
                toggleFolder(item.id);
                if (onItemClick) {
                  onItemClick(item.name, parentPath.length);
                }
              } else {
                setSelectedFile(item);
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="mr-2 h-4 w-4" />
                  <span>{item.starred ? 'Unstar' : 'Star'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pin className="mr-2 h-4 w-4" />
                  <span>{item.pinned ? 'Unpin' : 'Pin'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Change Tag</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isFolder && isExpanded && item.children && (
            <div className="ml-2">
              {renderFileTree(item.children, depth + 1, currentItemPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full rounded-lg overflow-hidden">
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
              {renderFileTree(filteredFiles)}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
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

        {/* File details sidebar */}
        {selectedFile && (
          <div className="w-72 flex-shrink-0 border-l p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-4">
              <h3 className="font-medium">File Info</h3>
              
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Music className="h-16 w-16 text-gray-400" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium">{selectedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.size} • {selectedFile.modified || 'Unknown date'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{selectedFile.type}</span>
                </div>
                {selectedFile.size && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Size</span>
                    <span className="text-sm font-medium">{selectedFile.size}</span>
                  </div>
                )}
                {selectedFile.modified && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modified</span>
                    <span className="text-sm font-medium">{selectedFile.modified}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}