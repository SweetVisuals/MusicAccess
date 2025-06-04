import { useState } from 'react';
import { Play, Pause, Heart, Download, MoreVertical, ListMusic, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Progress } from '@/components/@/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectListViewProps {
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
  id: string;
}

const ProjectListView = ({ project, id }: ProjectListViewProps) => {
  const { currentTrack, playTrack, isPlaying, togglePlay } = useAudioPlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if any track from this project is currently playing
  const isProjectPlaying = currentTrack && project.tracks.some(track => track.id === currentTrack.id);
  
  // Get the currently playing track from this project, if any
  const currentlyPlayingTrack = isProjectPlaying 
    ? project.tracks.find(track => track.id === currentTrack?.id) 
    : null;

  return (
    <div 
      id={id} 
      className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md border"
    >
      {/* Project Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Project Artwork */}
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <img
              src={project.artworkUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                size="icon" 
                className="rounded-full w-10 h-10 bg-white text-black hover:bg-white/90"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isProjectPlaying) {
                    togglePlay();
                  } else if (project.tracks.length > 0) {
                    playTrack({
                      ...project.tracks[0],
                      projectTitle: project.title,
                      artworkUrl: project.artworkUrl
                    });
                  }
                }}
              >
                {isProjectPlaying && isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-lg">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.totalTracks} tracks
                </p>
                {isProjectPlaying && currentlyPlayingTrack && (
                  <p className="text-sm text-primary mt-1">
                    Now playing: {currentlyPlayingTrack.title}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {project.isPopular && (
                  <Badge variant="secondary">Popular</Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t"
          >
            <div className="space-y-1 p-4">
              {project.tracks.map((track) => (
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
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                      });
                    }, 100);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left ${
                    currentTrack?.id === track.id 
                      ? 'bg-black text-white font-medium shadow-lg' 
                      : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                  }`}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className={`h-4 w-4 ${
                      currentTrack?.id === track.id 
                        ? 'text-white' 
                        : 'text-muted-foreground group-hover/track:text-white'
                    }`} />
                  ) : (
                    <Play className={`h-4 w-4 ${
                      currentTrack?.id === track.id 
                        ? 'text-white' 
                        : 'text-muted-foreground group-hover/track:text-white'
                    }`} />
                  )}
                  <span className="flex-1 truncate">{track.title}</span>
                  <span className={`text-xs tabular-nums ${
                    currentTrack?.id === track.id 
                      ? 'text-white/90' 
                      : 'text-muted-foreground/75 group-hover/track:text-white/90'
                  }`}>
                    {track.duration}
                  </span>
                </button>
              ))}
            </div>

            {/* Progress Bar (only shown for currently playing track) */}
            {project.tracks.some(track => track.id === currentTrack?.id) && (
              <div className="px-4 pb-4">
                <Progress value={45} className="h-1" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectListView;