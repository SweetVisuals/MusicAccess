import { Download, MoreVertical, Plus, User, Tag, MessageSquare, ShoppingCart, Gem, Trash2, FileUp, Bookmark } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import ProjectFileUploadDialog from './ProjectFileUploadDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectDetailCard from './ProjectDetailCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useCart } from '@/contexts/cart-context';
import { type Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  variant?: 'grid' | 'list';
  id: string;
  onDelete?: () => void;
}

const ProjectCard = ({ project, variant, id, onDelete }: ProjectCardProps) => {
  console.log('[ProjectCard] Initial project prop:', project);
  console.log('[ProjectCard] Initial project.audio_tracks:', project?.audio_tracks);
  const navigate = useNavigate();
  const { currentTrack, playTrack } = useAudioPlayer();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [trackGems, setTrackGems] = useState<Record<string, number>>({});
  const [trackDownloadStatus, setTrackDownloadStatus] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  const creator = {
    name: project.profiles?.username || project.creator_username || 'Creator',
    avatar: project.profiles?.avatarUrl || '',
    professional_title: project.profiles?.professional_title || 'User',
  };
  
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }
  // We're no longer fetching project files separately as we're only showing tracks
  
  // Fetch creator info when component mounts or project.user_id changes

  // Fetch initial gem counts for tracks
  useEffect(() => {
    const fetchTrackGemCounts = async () => {
      console.log('[ProjectCard] fetchTrackGemCounts - project.audio_tracks:', project?.audio_tracks);
      if (!project.audio_tracks || project.audio_tracks.length === 0) {
        setTrackGems({}); // Clear or set to empty if no tracks
        return;
      }

      const trackIds = project.audio_tracks.map(track => track.id).filter(id => id); // Ensure IDs are valid
      if (trackIds.length === 0) {
        console.log('[ProjectCard] fetchTrackGemCounts - no valid trackIds found.');
        setTrackGems({});
        return;
      }

      try {
        const { data: gemEvents, error: gemEventsError } = await supabase
          .from('analytics')
          .select('track_id')
          .eq('event_type', 'gem_given')
          .in('track_id', trackIds);

        if (gemEventsError) {
          console.error('Error fetching gem counts:', gemEventsError);
          toast.error('Could not load gem counts for tracks.');
        console.error('[ProjectCard] fetchTrackGemCounts - Supabase error:', gemEventsError);
          return;
        }

        const counts: Record<string, number> = {};
        // Initialize counts for all tracks in the project to 0
        project.audio_tracks.forEach(track => {
          if (track.id) {
            counts[track.id] = 0;
          }
        });

        // Aggregate counts from fetched gem events
        if (gemEvents) {
          gemEvents.forEach(event => {
            if (event.track_id && counts.hasOwnProperty(event.track_id)) {
              counts[event.track_id]++;
            }
          });
        }
        
        setTrackGems(counts);
        console.log('[ProjectCard] fetchTrackGemCounts - updated trackGems state:', counts);
      } catch (error) {
        console.error('Error in fetchTrackGemCounts:', error);
        toast.error('An unexpected error occurred while loading gem counts.');
      }
    };

    fetchTrackGemCounts();
  }, [project.audio_tracks]); // Dependency: project.audio_tracks

  useEffect(() => {
    const fetchTrackDownloadStatus = async () => {
      if (!project.audio_tracks || project.audio_tracks.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      const trackIds = project.audio_tracks.map(track => track.id).filter(id => id);
      if (trackIds.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      try {
        const { data: tracksData, error } = await supabase
          .from('audio_tracks') // Changed from 'tracks' to 'audio_tracks'
          .select('id, allow_download')
          .in('id', trackIds);

        if (error) {
          throw error;
        }

        const downloadStatus: Record<string, boolean> = {};
        if (tracksData) {
          tracksData.forEach(track => {
            downloadStatus[track.id] = track.allow_download;
          });
        }

        setTrackDownloadStatus(downloadStatus);
      } catch (error) {
        console.error('Error fetching track download status:', error);
        toast.error('Could not load track download status.');
      }
    };

    fetchTrackDownloadStatus();
  }, [project.audio_tracks]);

  const handleGiveGem = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to give gems");
      return;
    }
    
    try {
      // First check if user has gems available
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('gems')
        .eq('user_id', user.id)
        .single();
      
      if (statsError) throw statsError;
      
      if (!statsData || statsData.gems <= 0) {
        toast.error("You don't have any gems to give");
        return;
      }
      
      // Deduct gem from user
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ gems: statsData.gems - 1 })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Record the gem in analytics
      const { error: analyticsError } = await supabase
        .from('analytics')
        .insert([{
          event_type: 'gem_given',
          user_id: user.id,
          track_id: trackId,
          data: { project_id: project.id }
        }]);
      
      if (analyticsError) throw analyticsError;
      
      // Update local state
      setTrackGems(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));
      
      // Trigger a custom event to update the gem count in the header
      window.dispatchEvent(new CustomEvent('gem-balance-update'));
      
      toast.success("Gem given successfully!");
    } catch (error) {
      console.error('Error giving gem:', error);
      toast.error("Failed to give gem");
    }
  };

  const handleDeleteProject = async () => {
    if (!user) {
      toast.error("Please sign in to delete projects");
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete the project from the database
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success("Project deleted successfully");
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        // Refresh the page if no callback is provided
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };


  // No longer needed as we removed the file section

  return (
    <>
      <div
        id={id}
        onClick={() => navigate(`/view/${project.id.slice(-12)}`)}
        className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md w-full text-left cursor-pointer"
      >
        <div className="p-4 space-y-3">
          {/* Project Header */}
          <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium line-clamp-1">{project.title}</h3>
            <div className="text-xs text-muted-foreground">
              {project.audio_tracks?.length || 0} track{(project.audio_tracks?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.isPopular && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Popular
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Project
                </DropdownMenuItem>
                {user && user.id === project.user_id && (
                  <DropdownMenuItem 
                    className="text-red-500"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tracks List */}
        <div className="border-t pt-3">
          <div className="max-h-40 overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {/* Show tracks if available */}
            {project.audio_tracks?.slice(0, 10).map((track, index) => (
              <div key={track.id} className="flex items-center">
                <div className="flex items-center w-full">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playTrack({
                        ...track,
                        title: track.title ? track.title.replace(/\.[^/.]+$/, "") : '', // Remove file extension from title
                        audioUrl: track.file_url || track.audio_url, // Map file_url to audioUrl
                        projectTitle: project.title,
                        artworkUrl: project.artworkUrl,
                        duration: track.duration || '0:00', // Ensure duration is a string
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
                    className={`flex-grow flex items-center gap-2 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left min-w-0 ${
                      currentTrack?.id === track.id 
                        ? 'bg-black text-white font-medium shadow-lg' 
                        : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full min-w-0"> {/* Container for track info with min-w-0 to enable truncation */}
                      <span className={`text-xs tabular-nums w-6 shrink-0 ${currentTrack?.id === track.id ? 'text-white/80' : 'text-muted-foreground/60 group-hover/track:text-white/80'}`}>{index + 1}.</span>
                      <span className={`text-xs tabular-nums w-10 shrink-0 ${currentTrack?.id === track.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{track.duration || '0:00'}</span>
                      <span className="truncate text-sm group-hover/track:text-white transition-colors"> {/* Removed flex-1 and rely on parent's width constraints */}
                        {track.title ? track.title.replace(/\.[^/.]+$/, "") : ''}
                      </span>
                    </div>
                  </button>
                  
                  <div className="ml-auto flex items-center shrink-0">
                    {/* Individual Track Download Button */}
                    {trackDownloadStatus[track.id] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add download logic here
                          toast.info(`Downloading ${track.title}`);
                        }}
                        className="w-[32px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
                        title={`Download ${track.title ? track.title.replace(/\.[^/.]+$/, "") : ''}`}
                      >
                        <Download className="h-4 w-4 text-gray-400 hover:text-primary" />
                      </button>
                    )}
                    
                    {/* Gem Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent track play
                        handleGiveGem(track.id, e);
                      }}
                      className="w-[42px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-1 group/gem"
                      title={`Give a gem to ${track.title ? track.title.replace(/\.[^/.]+$/, "") : ''}`}
                    >
                        <Gem 
                          className={`h-4 w-4 transition-colors ${
                            (trackGems[track.id] || 0) > 0 
                              ? 'text-violet-500' 
                              : 'text-gray-400 hover:text-violet-500'
                          }`} 
                        />
                        <span className={`text-xs font-medium tabular-nums transition-colors ${
                            (trackGems[track.id] || 0) > 0 
                              ? 'text-violet-500' 
                              : 'text-gray-400 hover:text-violet-500'
                          }`}
                        >
                          {trackGems[track.id] || 0}
                        </span>
                      </button>
                  </div>
                </div>
              </div>
            ))}
            {(!project.audio_tracks || project.audio_tracks.length === 0) ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No tracks available
              </div>
            ) : null}
          </div>
        </div>

        {/* Creator Info and Action Icons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {creator.avatar ? (
                <AvatarImage src={creator.avatar} alt={creator.name} />
              ) : (
                <AvatarFallback>{creator.name ? creator.name[0] : 'C'}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {creator.name}
              </p>
              {creator.professional_title && (
                <p className="text-xs text-muted-foreground truncate">
                  {creator.professional_title}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (project.user_id !== user?.id) {
                        addToCart(project.id, 'project');
                        toast.success(`${project.title} added to cart`);
                      }
                    }}
                    disabled={project.user_id === user?.id}
                  >
                    <ShoppingCart className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </TooltipTrigger>
                {project.user_id === user?.id && (
                  <TooltipContent>
                    <p>You can't add your own project to the cart.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {/* Contact Creator button removed as per request */}
            {project.allow_downloads && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add project download logic here
                          toast.info(`Downloading project: ${project.title}`);
                        }}
                      >
                        <Download className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Project</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
          </div>
          </div>
        </div>
      </div>
      <ProjectDetailCard
        project={project}
        isOpen={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
      />
      {/* Import and use ProjectFileUploadDialog */}
    {showUploadDialog && (
      <ProjectFileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        projectId={project.id}
        onUploadComplete={() => {
          if (onDelete) {
            onDelete();
          }
        }}
      />
    )}
    </>
  );
};

export default ProjectCard;
