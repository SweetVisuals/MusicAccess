import { Play, Heart, Download, MoreVertical, ListMusic, Plus } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';

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
  const { currentTrack, playTrack } = useAudioPlayer();
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  return (
    <div id={id} className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Project Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium">{project.title}</h3>
            <div className="text-xs text-muted-foreground">
              {project.totalTracks} track{project.totalTracks !== 1 ? 's' : ''}
            </div>
          </div>
          {project.isPopular && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Popular
            </Badge>
          )}
        </div>

        {/* Tracks List */}
        <div className="border-t pt-3">
          <div className="max-h-40 overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1">
            {project.tracks.slice(0, 10).map((track) => (
              <button
                key={track.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playTrack({
                    ...track,
                    projectTitle: project.title,
                    artworkUrl: project.artworkUrl
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
                  currentTrack?.id === track.id 
                    ? 'bg-black text-white font-medium shadow-lg' 
                    : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                }`}
              >
                <span className={`text-xs tabular-nums w-8 ${currentTrack?.id === track.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{track.duration}</span>
                <span className="truncate text-sm group-hover/track:text-white transition-colors">
                  {track.title}
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
