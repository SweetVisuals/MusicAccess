import { Play, Heart, Download, MoreVertical, ListMusic, Plus, Pause } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { useState } from 'react';

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

const ProjectCard = ({ project, variant, id }: ProjectCardProps) => {
  const { currentTrack, playTrack, isPlaying, togglePlay } = useAudioPlayer();
  const [expanded, setExpanded] = useState(false);
  
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  // Generate 10 audio files for each project
  const audioFiles = Array.from({ length: 10 }, (_, i) => ({
    id: `${project.id}-file-${i + 1}`,
    title: `${i === 0 ? 'Main Mix' : i === 1 ? 'Instrumental' : `Stem ${i - 1}`}`,
    duration: `${Math.floor(Math.random() * 3) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    size: `${Math.floor(Math.random() * 40) + 5} MB`,
    type: i < 2 ? 'wav' : 'mp3'
  }));

  const isProjectPlaying = currentTrack?.id.startsWith(project.id);

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
                {project.totalTracks} track{project.totalTracks !== 1 ? 's' : ''}
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
          <div className="max-h-40 overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1">
            {audioFiles.map((file) => (
              <button
                key={file.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playTrack({
                    id: file.id,
                    title: file.title,
                    projectTitle: project.title,
                    artworkUrl: project.artworkUrl,
                    duration: file.duration
                  });
                  // Scroll to bottom to ensure player is visible
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: 'smooth'
                    });
                  }, 100);
                }}
                onPointerDown={(e) => {
                  // Prevent drag events from interfering with clicks
                  if (e.pointerType === 'mouse') {
                    e.preventDefault();
                  }
                }}
                draggable={false}
                onDragStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left ${
                  currentTrack?.id === file.id 
                    ? 'bg-black text-white font-medium shadow-lg' 
                    : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                }`}
              >
                <span className={`text-xs tabular-nums w-8 ${currentTrack?.id === file.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{file.duration}</span>
                <span className="truncate text-sm group-hover/track:text-white transition-colors">
                  {file.title}
                </span>
                <span className="ml-auto text-xs text-muted-foreground/75 group-hover/track:text-white/70">
                  {file.type}
                </span>
                <span className="text-xs text-muted-foreground/75 group-hover/track:text-white/70 w-16 text-right">
                  {file.size}
                </span>
              </button>
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