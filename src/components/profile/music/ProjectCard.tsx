import { Play, Heart, Download, MoreVertical, ListMusic, Plus, Pause, Edit, Trash, GripVertical, X, Check } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { useState, useRef } from 'react';
import { Input } from '@/components/@/ui/input';
import { useDrag, useDrop } from 'react-dnd';
import { CSS } from '@dnd-kit/utilities';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    artworkUrl: string;
    tracks: Array<{
      id: string;
      title: string;
      duration: string;
    }>;
    totalTracks: number;
    isPopular: boolean;
  };
  variant: 'grid' | 'list';
  id: string;
}

// Generate 10 audio files for each project
const generateAudioFiles = (projectId: string) => [
  {
    id: `${projectId}-file-1`,
    title: 'Main Mix',
    duration: '3:45',
    size: '24.5 MB',
    type: 'wav'
  },
  {
    id: `${projectId}-file-2`,
    title: 'Instrumental',
    duration: '3:42',
    size: '22.8 MB',
    type: 'wav'
  },
  {
    id: `${projectId}-file-3`,
    title: 'Stem - Drums',
    duration: '3:45',
    size: '18.2 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-4`,
    title: 'Stem - Bass',
    duration: '3:45',
    size: '12.4 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-5`,
    title: 'Stem - Synths',
    duration: '3:45',
    size: '15.7 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-6`,
    title: 'Stem - Vocals',
    duration: '3:45',
    size: '14.3 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-7`,
    title: 'Stem - FX',
    duration: '3:45',
    size: '8.6 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-8`,
    title: 'Stem - Pads',
    duration: '3:45',
    size: '10.2 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-9`,
    title: 'Stem - Leads',
    duration: '3:45',
    size: '9.8 MB',
    type: 'mp3'
  },
  {
    id: `${projectId}-file-10`,
    title: 'Acapella',
    duration: '3:45',
    size: '7.5 MB',
    type: 'mp3'
  }
];

interface TrackItemProps {
  file: {
    id: string;
    title: string;
    duration: string;
    size: string;
    type: string;
  };
  index: number;
  projectTitle: string;
  projectArtwork: string;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: (track: Track) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

const TrackItem = ({ 
  file, 
  index,
  projectTitle,
  projectArtwork,
  isPlaying,
  isCurrentTrack,
  onPlay,
  onDelete,
  onRename,
  onReorder
}: TrackItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(file.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'TRACK',
    item: { id: file.id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'TRACK',
    hover(item: { id: string; index: number }, monitor) {
      if (!item) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      onReorder(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const saveEdit = () => {
    if (editedTitle.trim()) {
      onRename(file.id, editedTitle);
    } else {
      setEditedTitle(file.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(file.title);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left ${
        isCurrentTrack 
          ? 'bg-black text-white font-medium shadow-lg' 
          : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-center cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover/track:text-white/50" />
      </div>
      
      <span className={`text-xs tabular-nums w-8 ${isCurrentTrack ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>
        {file.duration}
      </span>
      
      {isEditing ? (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-7 py-1 bg-transparent border-muted-foreground/30 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              saveEdit();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          className="flex-1 min-w-0 text-left"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPlay({
              id: file.id,
              title: file.title,
              projectTitle: projectTitle,
              artworkUrl: projectArtwork,
              duration: file.duration,
              size: file.size,
              type: file.type
            });
          }}
        >
          <span className="truncate text-sm group-hover/track:text-white transition-colors">
            {file.title}
          </span>
        </button>
      )}
      
      <span className="ml-auto text-xs text-muted-foreground/75 group-hover/track:text-white/70">
        {file.type}
      </span>
      
      <span className="text-xs text-muted-foreground/75 group-hover/track:text-white/70 w-16 text-right">
        {file.size}
      </span>
      
      <div className="flex items-center gap-1">
        {!isEditing && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 opacity-0 group-hover/track:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 opacity-0 group-hover/track:opacity-100 transition-opacity text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const ProjectCard = ({ project, variant, id }: ProjectCardProps) => {
  const { currentTrack, playTrack, isPlaying, togglePlay } = useAudioPlayer();
  const [audioFiles, setAudioFiles] = useState(() => generateAudioFiles(project.id));
  
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  const isProjectPlaying = currentTrack?.id.startsWith(project.id);

  const handlePlayTrack = (track: Track) => {
    playTrack(track);
    // Scroll to bottom to ensure player is visible
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleDeleteTrack = (trackId: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== trackId));
  };

  const handleRenameTrack = (trackId: string, newTitle: string) => {
    setAudioFiles(prev => prev.map(file => 
      file.id === trackId ? { ...file, title: newTitle } : file
    ));
  };

  const handleReorderTracks = (dragIndex: number, hoverIndex: number) => {
    setAudioFiles(prev => {
      const newFiles = [...prev];
      const draggedItem = newFiles[dragIndex];
      newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, draggedItem);
      return newFiles;
    });
  };

  return (
    <div id={id} className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Project Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-md overflow-hidden">
              <img
                src={project.artworkUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isProjectPlaying) {
                      togglePlay();
                    } else {
                      playTrack({
                        id: `${project.id}-main`,
                        title: project.title,
                        duration: project.tracks[0].duration,
                        artworkUrl: project.artworkUrl
                      });
                    }
                  }}
                >
                  {isProjectPlaying && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-medium">{project.title}</h3>
              <div className="text-xs text-muted-foreground">
                {audioFiles.length} track{audioFiles.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {project.isPopular && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Popular
            </Badge>
          )}
        </div>

        {/* Files List */}
        <div className="border-t pt-3">
          <div className="max-h-[320px] overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1">
            {audioFiles.map((file, index) => (
              <TrackItem
                key={file.id}
                file={file}
                index={index}
                projectTitle={project.title}
                projectArtwork={project.artworkUrl}
                isPlaying={isPlaying}
                isCurrentTrack={currentTrack?.id === file.id}
                onPlay={handlePlayTrack}
                onDelete={handleDeleteTrack}
                onRename={handleRenameTrack}
                onReorder={handleReorderTracks}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <ListMusic className="h-4 w-4 mr-2" />
                Add to playlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;