import { useState, useEffect } from 'react';
import { File, Folder, ChevronRight, MoreVertical, Star, Pin, Tag, Trash2, Pencil } from 'lucide-react';
import { AudioFileManager } from './audio-file-manager';
import { VideoFileManager } from './video-file-manager';
import { ImageFileManager } from './image-file-manager';
import { DocumentFileManager } from './document-file-manager';


function cloneFileData(files: FileItem[]): FileItem[] {
  return files.map(file => ({
    id: file.id,
    name: file.name,
    type: file.type,
    size: file.size,
    modified: file.modified,
    pinned: file.pinned,
    starred: file.starred,
    badge: file.badge ? {
      variant: file.badge.variant,
      label: file.badge.label
    } : undefined,
    children: file.children ? cloneFileData(file.children) : undefined
  }));
}
import { Button } from '../@/ui/button';
import { Badge } from '../@/ui/badge';
import { Progress } from '../@/ui/progress';
import { cn } from '../@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../@/ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import filesData from './files.json';

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

export function FileManager({ className, initialFiles = filesData, activeFilter = 'all' }: FileManagerProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileItems, setFileItems] = useState<FileItem[]>(initialFiles);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>(initialFiles);

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
          
          if (item.type === 'file') {
            const ext = item.name.split('.').pop()?.toLowerCase();
            switch (activeFilter) {
              case 'audio':
                return ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext!) ? item : null;
              case 'video':
                return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext!) ? item : null;
              case 'image':
                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext!) ? item : null;
              case 'document':
                return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'odt'].includes(ext!) ? item : null;
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
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const getCurrentItems = (path: string[] = []) => {
    let current: FileItem[] = filteredFiles;
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

  useEffect(() => {
    // Reset selected path when files change (from filtering)
    setSelectedPath([]);
  }, [filteredFiles]);

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

  const DraggableItem = ({ item, index, columnIndex }: { item: FileItem, index: number, columnIndex: number }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: item.type === 'folder' ? ItemTypes.FOLDER : ItemTypes.FILE,
      item: { id: item.id, index, type: item.type },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    const [, drop] = useDrop(() => ({
      accept: [ItemTypes.FILE, ItemTypes.FOLDER],
      hover: (draggedItem: DraggableItem) => {
        if (draggedItem.id !== item.id) {
          const currentItems = getCurrentItems(columnIndex === 0 ? [] : selectedPath.slice(0, columnIndex));
          const newItems = [...currentItems];
          const [removed] = newItems.splice(draggedItem.index, 1);
          newItems.splice(index, 0, removed);
          
          if (columnIndex === 0) {
            setFileItems(newItems);
            setFilteredFiles(newItems);
          } else {
            // For nested folders, we need to update the parent's children
            const path = selectedPath.slice(0, columnIndex);
            const parentItems = getCurrentItems(path.slice(0, -1));
            const parentItem = parentItems.find(i => i.name === path[path.length - 1]);
            if (parentItem) {
              parentItem.children = newItems;
              const updatedFiles = [...fileItems];
              setFileItems(updatedFiles);
              setFilteredFiles(updatedFiles);
            }
          }
        }
      },
    }));

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between ${
          selectedPath[columnIndex] === item.name ? 'bg-gray-100 font-medium' : ''
        }`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => {
          if (item.type === 'folder') {
            handleItemClick(item.name, columnIndex);
            setSelectedFile(null);
          } else {
            setSelectedFile(item);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {item.type === 'folder' ? (
            <Folder className="h-4 w-4 text-amber-500" />
          ) : (
            <File className="h-4 w-4 text-gray-500" />
          )}
          <span>{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.badge && (
            <Badge variant={item.badge.variant as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {item.badge.label}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
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
          {item.type === 'folder' && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    );
  };

  const renderColumn = (items: FileItem[], index: number) => (
    <div key={index} className="flex-1 min-w-0 w-full border-r border-gray-200">
      <div className="p-2">
        {items.map((item, itemIndex) => (
          <DraggableItem key={item.id} item={item} index={itemIndex} columnIndex={index} />
        ))}
      </div>
    </div>
  );

  const columns = [];
  const currentItems = getCurrentItems();
  
  // Always show root column
  columns.push(renderColumn(currentItems, 0));

  // Show columns for selected path
  let pathItems = currentItems;
  for (let i = 0; i < selectedPath.length; i++) {
    const pathSegment = selectedPath[i];
    const foundItem = pathItems.find(item => item.name === pathSegment);
    
    if (foundItem && foundItem.children) {
      pathItems = foundItem.children;
      columns.push(renderColumn(pathItems, i + 1));
    } else {
      // Invalid path segment - reset path
      setSelectedPath(selectedPath.slice(0, i));
      break;
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">File Browser</h2>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {activeFilter === 'all' ? (
            <div className="flex flex-1 min-w-0">
              {columns}
            </div>
          ) : (
            <div className="flex-1 p-4">
              {activeFilter === 'audio' && <AudioFileManager />}
              {activeFilter === 'video' && <VideoFileManager />}
              {activeFilter === 'image' && <ImageFileManager />}
              {activeFilter === 'document' && <DocumentFileManager />}
            </div>
          )}
          {selectedFile && (
            <div className="w-72 flex-shrink-0 border-l border-r border-gray-200 p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">File Info</h3>
                
                {selectedFile.type === 'audio' && (
                  <div className="space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="absolute w-full h-full text-gray-200"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray="283"
                            strokeDashoffset="70"
                          />
                        </svg>
                        <button 
                          className="relative z-10 w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center"
                          onClick={() => {
                            if (!audioInstance) {
                              const audio = new Audio(`/audio/${selectedFile.name}`);
                              setAudioInstance(audio);
                              audio.play()
                                .then(() => setIsPlaying(true))
                                .catch(e => console.error('Audio playback failed:', e));
                            } else if (audioInstance.paused) {
                              audioInstance.play()
                                .then(() => setIsPlaying(true))
                                .catch(e => console.error('Audio playback failed:', e));
                            } else {
                              audioInstance.pause();
                              setIsPlaying(false);
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {!isPlaying ? (
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            ) : (
                              <>
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium">{selectedFile.name}</h4>
                      <p className="text-sm text-gray-500">
                        {selectedFile.size} • {selectedFile.modified}
                      </p>
                    </div>
                  </div>
                )}

                {selectedFile.type === 'image' && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">Image Preview</p>
                    <div className="h-40 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">Image Preview</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium">{selectedFile.type}</span>
                  </div>
                  {selectedFile.size && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Size</span>
                      <span className="text-sm font-medium">{selectedFile.size}</span>
                    </div>
                  )}
                  {selectedFile.modified && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Modified</span>
                      <span className="text-sm font-medium">{selectedFile.modified}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
          <div className="space-y-2">
        </div>
      </div>
    </DndProvider>
  );
}
