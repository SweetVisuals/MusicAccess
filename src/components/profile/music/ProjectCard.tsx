import { useState } from 'react';
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
import { motion } from 'framer-motion';

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
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  return (
    <motion.div 
      id={id} 
      className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md"
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Project Artwork */}
      <div className="relative aspect-square">
        <img
          src={project.artworkUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Button 
              size="icon" 
              className="rounded-full w-12 h-12 bg-white text-black hover:bg-white/90"
              onClick={() => {
                if (project.tracks.length > 0) {
                  playTrack({
                    ...project.tracks[0],
                    projectTitle: project.title,
                    artworkUrl: project.artworkUrl
                  });
                }
              }}
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium truncate">{project.title}</h3>
            <p className="text-sm text-muted-foreground">
              {project.totalTracks} tracks
            </p>
          </div>
          {project.isPopular && (
            <Badge variant="secondary">Popular</Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
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
    </motion.div>
  );
};

export default ProjectCard;