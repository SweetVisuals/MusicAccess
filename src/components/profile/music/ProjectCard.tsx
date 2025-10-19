import { Download, MoreVertical, Plus, User, Tag, MessageSquare, ShoppingCart, Gem, Trash2, FileUp, Bookmark, Edit } from 'lucide-react';
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
import { useNavigate, Link } from 'react-router-dom';
import ProjectDetailCard from './ProjectDetailCard';
import ProjectCartDialog from './ProjectCartDialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useCart } from '@/contexts/cart-context';
import { useGemsBalance } from '@/contexts/gems-balance-context';
import { useGivenGems } from '@/hooks/useGivenGems';
import { useBookmarks } from '@/hooks/useBookmarks';
import { type Project } from '@/lib/types';
import { formatDuration, parseDuration } from '@/lib/utils';
import { extractAndUpdateAudioDuration, getAudioDuration } from '@/lib/audio-utils';
import ProjectEditDialog from './ProjectEditDialog';

interface ProjectCardProps {
  project: Project;
  variant?: 'grid' | 'list';
  id: string;
  onDelete?: () => void;
  showTracks?: boolean;
  onAddToCart?: (entityId: string, entityType: 'track' | 'project' | 'service', quantity?: number) => Promise<void>;
}

const ProjectCard = ({ project, variant, id, onDelete, onAddToCart }: ProjectCardProps) => {
  // Helper function to get file type - using the same logic as file browser/upload wizard
  const getFileType = (input: string): string => {
    // If input is empty, return 'other'
    if (!input) {
      return 'other';
    }

    // First try to extract extension from the input (could be filename or URL)
    let extension = '';
    if (input.includes('.')) {
      // Handle URLs by getting the last part after the last slash
      const urlParts = input.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      extension = lastPart.split('.').pop()?.toLowerCase() || '';
    }

    // If no extension found, try common audio file patterns
    if (!extension) {
      // Common audio file extensions that might be in the URL
      const audioExtensions = ['mp3', 'wav', 'wave', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff'];
      for (const ext of audioExtensions) {
        if (input.toLowerCase().includes('.' + ext)) {
          extension = ext;
          break;
        }
      }
    }

    // Map extensions to file types (same logic as upload wizard)
    const formatMap: { [key: string]: string } = {
      'mp3': 'mp3', 'wav': 'wav', 'wave': 'wav', 'flac': 'other', 'aac': 'other', 'ogg': 'other',
      'wma': 'other', 'm4a': 'other', 'aiff': 'other', 'au': 'other', 'ra': 'other',
      'mp4': 'other', 'avi': 'other', 'mov': 'other', 'wmv': 'other', 'flv': 'other',
      'webm': 'other', 'mkv': 'other', 'jpg': 'other', 'jpeg': 'other', 'png': 'other',
      'gif': 'other', 'bmp': 'other', 'tiff': 'other', 'webp': 'other', 'svg': 'other',
      'pdf': 'other', 'doc': 'other', 'docx': 'other', 'txt': 'other', 'rtf': 'other',
      'odt': 'other', 'zip': 'stems', 'rar': 'stems', '7z': 'stems', 'tar': 'other', 'gz': 'other'
    };

    return formatMap[extension] || 'other';
  };

  const [trackGems, setTrackGems] = useState<Record<string, number>>({});
  const [trackDownloadStatus, setTrackDownloadStatus] = useState<Record<string, boolean>>({});
  const [trackVariants, setTrackVariants] = useState<any[]>([]);
  const [projectAudioTracks, setProjectAudioTracks] = useState<any[]>(project.audio_tracks || []);
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const audioTrackMap = useMemo(() => {
    if (!projectAudioTracks.length) return new Map();
    // Map audio_tracks by audio_url for quick lookup
    return new Map(projectAudioTracks.map(track => [track.audio_url, track]));
  }, [projectAudioTracks]);

  const fileToTrackMap = useMemo(() => {
    const map = new Map();
    trackVariants.forEach(tv => {
      if (tv.audio_tracks) {
        map.set(tv.file_id, tv.audio_tracks);
      }
    });
    return map;
  }, [trackVariants]);

  const audioTracks = useMemo(() => {
    // Extract tracks from project_files - this ensures all audio files are shown
    if (project.project_files && project.project_files.length > 0) {
      return project.project_files
        .filter(pf => {
          const fileType = getFileType(pf.files.file_path || pf.files.name || pf.files.file_url || '');
          return fileType === 'mp3' || fileType === 'wav' || fileType === 'stems';
        }) // Only include audio files
        .map(pf => {
          const fileUrl = pf.files.audio_url || pf.files.file_url || '';
          const correspondingTrack = fileToTrackMap.get(pf.file_id) || audioTrackMap.get(fileUrl);

          return {
            id: correspondingTrack?.id || pf.id,
            // Prioritize the title from audio_tracks (which contains the group name if set)
            title: correspondingTrack?.title || pf.files.name || pf.files.title || `Track ${pf.id}`,
            audio_url: fileUrl,
            allow_download: pf.allow_downloads || false,
            price: pf.price || undefined,
            duration: trackDurations[pf.id] || correspondingTrack?.duration_seconds || pf.files.duration_seconds || correspondingTrack?.duration || pf.files.duration || 0,
            project_id: project.id,
            user_id: project.user_id,
            created_at: pf.created_at,
            updated_at: pf.updated_at,
            // Add file type information for filtering
            file_type: pf.files.file_type || getFileType(pf.files.file_path || pf.files.name || pf.files.file_url || ''),
            file_name: pf.files.name || pf.files.file_url || '',
            correspondingTrackId: correspondingTrack?.id
          };
        });
    }

    // Fallback to audio_tracks if no project_files
    if (project.audio_tracks && project.audio_tracks.length > 0) {
      return project.audio_tracks;
    }

    return [];
  }, [project.project_files, fileToTrackMap]);

  // Group tracks by track group and prioritize MP3 files
  const trackGroups = useMemo(() => {
    // If no audio tracks, return empty array
    if (!audioTracks || audioTracks.length === 0) {
      return [];
    }

    const groups = new Map();


    audioTracks.forEach((track, index) => {
      // Get file extension to determine type - handle both Track type and extended type
      const fileName = (track as any).file_name || track.title || '';
      const audioUrl = track.audio_url || '';

      // Use audio URL if filename doesn't have extension, otherwise use filename
      const inputForType = fileName.includes('.') ? fileName : audioUrl;
      const fileType = getFileType(inputForType);

      // Group by correspondingTrackId if exists, otherwise by track title. Tracks with the same correspondingTrackId or title are considered variants of a single track group.
      const groupKey = (track as any).correspondingTrackId || track.title || `Track ${track.id}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          title: track.title,
          tracks: [],
          mp3Track: null,
          bestTrack: null // Fallback track if no MP3
        });
      }

      const group = groups.get(groupKey);
      group.tracks.push(track);

      // Prioritize MP3 for playback, but keep a fallback
      if (fileType === 'mp3') {
        group.mp3Track = track;
        group.bestTrack = track; // MP3 is the best option
      } else if (!group.bestTrack) {
        // If no MP3 found yet, use this track as fallback
        group.bestTrack = track;
      }
    });

    const result = Array.from(groups.values()).filter(group => group.bestTrack);

    return result;
  }, [audioTracks]);

  // Fallback: if no track groups are created, show original tracks as individual groups
  const displayGroups = useMemo(() => {
    if (trackGroups.length > 0) {
      return trackGroups;
    }

    // If no groups were created, create individual groups from audioTracks
    if (audioTracks.length > 0) {
      return audioTracks.map(track => ({
        id: track.id,
        title: track.title || `Track ${track.id}`,
        tracks: [track],
        mp3Track: null,
        bestTrack: track
      }));
    }

    return [];
  }, [trackGroups, audioTracks]);
  const navigate = useNavigate();
  const { currentTrack, playTrack } = useAudioPlayer();
  const { user } = useAuth();
  const { addToCart, addTrackToCart, isInCart, recentlyAddedId } = useCart();
  const { gemsBalance, refetch: refetchGemsBalance } = useGemsBalance();
  const { giveGems, revokeGems, canRevoke, isLoading: isGivingGems } = useGivenGems();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const creator = {
    name: project.profiles?.full_name || project.creator_username || 'Creator',
    username: project.profiles?.username || project.creator_username || '',
    avatar: project.profiles?.avatarUrl || '',
    professional_title: project.profiles?.professional_title || 'User',
  };

  // We're no longer fetching project files separately as we're only showing tracks

  // Fetch creator info when component mounts or project.user_id changes

  // Helper function to check if string is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fetch audio tracks if not provided in project prop
  useEffect(() => {
    const fetchAudioTracks = async () => {
      if (!project.id || !isValidUUID(project.id)) return;

      try {
        const { data, error } = await supabase
          .from('audio_tracks')
          .select('*')
          .eq('project_id', project.id);

        if (error) throw error;
        setProjectAudioTracks(data || []);
      } catch (error) {
        console.error('Error fetching audio tracks:', error);
      }
    };

    if (!project.audio_tracks || project.audio_tracks.length === 0) {
      fetchAudioTracks();
    }
  }, [project.id, project.audio_tracks]);

  // Fetch track variants
  useEffect(() => {
    const fetchTrackVariants = async () => {
      if (!project.id || !isValidUUID(project.id) || !project.project_files?.length) {
        setTrackVariants([]);
        return;
      }

      try {
        const fileIds = project.project_files.map(pf => pf.file_id);
        const { data, error } = await supabase
          .from('track_variants')
          .select('*, audio_tracks(*)')
          .in('file_id', fileIds);

        if (error) throw error;
        setTrackVariants(data || []);
      } catch (error) {
        console.error('Error fetching track variants:', error);
      }
    };

    fetchTrackVariants();
  }, [project.id, project.project_files]);

  // Fetch gems received per track
    useEffect(() => {
      let isMounted = true;

      const fetchTrackGemCounts = async () => {
        try {
          if (!displayGroups || displayGroups.length === 0) {
            setTrackGems({});
            return;
          }

          const trackIds = displayGroups.map(group => group.bestTrack?.id).filter(id => id && isValidUUID(id));
          if (trackIds.length === 0) {
            setTrackGems({});
            return;
          }

          // Get gem count for each track
          const { data: gemEvents, error: gemEventsError } = await supabase
            .from('given_gems')
            .select('track_id')
            .eq('status', 'active')
            .in('track_id', trackIds);

          if (gemEventsError) {
            console.error('Error fetching gem counts:', gemEventsError);
            setTrackGems({});
            return;
          }

          // Count gems per track
          const counts: Record<string, number> = {};
          gemEvents?.forEach(event => {
            if (event.track_id) {
              counts[event.track_id] = (counts[event.track_id] || 0) + 1;
            }
          });

          setTrackGems(counts);
        } catch (error) {
          console.error('Error in fetchTrackGemCounts:', error);
          if (isMounted) {
            setFetchError('Failed to load track gem counts');
            toast.error('An unexpected error occurred while loading gem information.');
          }
        }
      };

      fetchTrackGemCounts();

      return () => {
        isMounted = false;
      };
    }, [displayGroups]); // Dependency: displayGroups

  // Listen for track gem updates from other components
  useEffect(() => {
    const handleTrackGemUpdate = (event: CustomEvent) => {
      const { trackId, gemCount } = event.detail
      setTrackGems(prev => ({
        ...prev,
        [trackId]: gemCount
      }))
    }

    window.addEventListener('track-gem-update', handleTrackGemUpdate as EventListener)

    return () => {
      window.removeEventListener('track-gem-update', handleTrackGemUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    const fetchTrackDownloadStatus = async () => {
      if (!displayGroups || displayGroups.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      const trackIds = displayGroups.map(group => group.bestTrack?.id).filter(id => id && isValidUUID(id));
      if (trackIds.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      try {
        // Since allow_download is now on the ProjectFile level, we can get it directly from best tracks
        const downloadStatus: Record<string, boolean> = {};
        displayGroups.forEach(group => {
          if (group.bestTrack) {
            downloadStatus[group.bestTrack.id] = group.bestTrack.allow_download || false;
          }
        });

        setTrackDownloadStatus(downloadStatus);
      } catch (error) {
        console.error('Error fetching track download status:', error);
        toast.error('Could not load track download status.');
      }
    };

    fetchTrackDownloadStatus();
  }, [displayGroups]);

  // Extract and update durations for tracks that don't have them
  useEffect(() => {
    const extractMissingDurations = async () => {
      if (!displayGroups || displayGroups.length === 0) return;

      const tracksToUpdate = displayGroups
        .map(group => group.bestTrack)
        .filter(track => track && (!track.duration_seconds || track.duration_seconds === 0) && track.audio_url)
        .map(track => ({
          id: track!.id,
          audio_url: track!.audio_url,
          file_id: (track as any).file_id
        }));

      if (tracksToUpdate.length === 0) return;

      for (const track of tracksToUpdate) {
        try {
          const duration = await getAudioDuration(track.audio_url);
          if (duration && duration > 0) {
            // Update the local state immediately for better UX
            setTrackDurations(prev => ({
              ...prev,
              [track.id]: duration
            }));

            // Update the database in the background
            extractAndUpdateAudioDuration(track.audio_url, track.id, track.file_id)
              .then(() => {
                console.log(`Updated duration for track ${track.id}: ${duration}s`);
              })
              .catch(error => {
                console.error('Error updating duration in database:', error);
              });
          }
        } catch (error) {
          console.error('Error extracting duration for track:', track.id, error);
        }
      }
    };

    extractMissingDurations();
  }, [displayGroups]);

  if (fetchError) {
    return (
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">Could not load project details</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFetchError(null)}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  const handleGiveGem = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to give gems");
      return;
    }

    if (user.id === project.user_id) {
      toast.error("You cannot give gems to your own tracks");
      return;
    }

    if (gemsBalance <= 0) {
      toast.error("You don't have any gems to give");
      return;
    }

    // Check if user has already given a gem to this track
    try {
      const { data: existingGems, error: checkError } = await supabase
        .from('given_gems')
        .select('id')
        .eq('giver_id', user.id)
        .eq('track_id', trackId)
        .eq('status', 'active')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing gems:', checkError);
        toast.error("Failed to check gem status");
        return;
      }

      if (existingGems && existingGems.length > 0) {
        toast.error("You have already given a gem to this track");
        return;
      }

      const result = await giveGems(project.user_id, 1, trackId);
      toast.success(`Gave 1 gem to track!`);

      // Update local state for this specific track
      setTrackGems(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));

      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('track-gem-update', {
        detail: { trackId, gemCount: (trackGems[trackId] || 0) + 1 }
      }));

      refetchGemsBalance();
    } catch (error) {
      console.error('Error giving gem:', error);
      toast.error("Failed to give gem");
    }
  };

  const handleGiveGemsToCreator = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to give gems");
      return;
    }

    if (user.id === project.user_id) {
      toast.error("You cannot give gems to yourself");
      return;
    }

    if (gemsBalance <= 0) {
      toast.error("You don't have any gems to give");
      return;
    }

    // Check if user has already given a gem to this creator
    try {
      const { data: existingGems, error: checkError } = await supabase
        .from('given_gems')
        .select('id')
        .eq('giver_id', user.id)
        .eq('receiver_id', project.user_id)
        .eq('status', 'active')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing gems:', checkError);
        toast.error("Failed to check gem status");
        return;
      }

      if (existingGems && existingGems.length > 0) {
        toast.error("You have already given a gem to this creator");
        return;
      }

      const result = await giveGems(project.user_id, 1);
      toast.success(`Gave 1 gem to ${creator.name}!`);

      // Update local state for all tracks (since it's creator-wide)
      setTrackGems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = (updated[key] || 0) + 1;
        });
        return updated;
      });

      refetchGemsBalance();
    } catch (error) {
      console.error('Error giving gems to creator:', error);
      toast.error("Failed to give gems");
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
      <style>
        {`
          .custom-scroll::-webkit-scrollbar {
            width: 1px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgb(156 163 175);
            border-radius: 0.5px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgb(107 114 128);
          }
        `}
      </style>
      <div
        id={id}
        className="group relative rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md w-full text-left min-h-80 flex flex-col"
      >
        <div className="p-4 flex flex-col flex-1 space-y-3">
          {/* Contract badge if exists */}
          {project.contract_url && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                Contract Available
              </Badge>
            </div>
          )}
          {/* Project Header */}
          <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/view/${project.id}`} className="hover:underline">
              <h3 className="font-medium line-clamp-1">{project.title}</h3>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {displayGroups.length || 0} track{(displayGroups.length || 0) !== 1 ? 's' : ''}
              </span>
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
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={handleDeleteProject}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Track Groups List */}
        <div className="border-t pt-3 flex-1 flex flex-col">
          <div className="h-48 bg-background/50 rounded-lg p-1 custom-scroll overflow-y-auto">
            <div className="space-y-0.5">

            {/* Show track groups if available */}
            {displayGroups.map((group, index) => (
              <div key={group.id} className="flex items-center">
                <div className="flex items-center w-full">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (group.bestTrack) {
                        // Ensure we're playing the MP3 version if available
                        const trackToPlay = group.mp3Track || group.bestTrack;
                        const trackFileName = (trackToPlay as any).file_name || trackToPlay.title || '';
                        const trackAudioUrl = trackToPlay.audio_url || '';
                        const trackInput = trackFileName.includes('.') ? trackFileName : trackAudioUrl;
                        const fileType = getFileType(trackInput);


                        // Check if the file type is supported by the browser
                        if (fileType !== 'mp3' && fileType !== 'wav') {
                          const supportedFormats = ['MP3', 'WAV'];
                          toast.error(`This track is in ${fileType.toUpperCase()} format. Only ${supportedFormats.join(', ')} formats are supported by your browser. Please ensure MP3 or WAV files are available.`);
                          return;
                        }

                        playTrack({
                          id: trackToPlay.id,
                          title: group.title, // Use track group title
                          audio_url: trackToPlay.audio_url,
                          audioUrl: trackToPlay.audio_url, // Add both audioUrl and audio_url for compatibility
                          file_url: trackToPlay.audio_url, // Fallback field
                          project_id: trackToPlay.project_id,
                          user_id: trackToPlay.user_id,
                          allow_download: trackToPlay.allow_download,
                          price: trackToPlay.price,
                          duration: trackDurations[trackToPlay.id] || trackToPlay.duration_seconds || trackToPlay.duration || 0,
                          created_at: trackToPlay.created_at,
                          updated_at: trackToPlay.updated_at,
                          projectTitle: project.title,
                          artworkUrl: project.cover_image_url,
                        });
                        // Scroll to bottom to ensure player is visible
                        setTimeout(() => {
                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: 'smooth'
                          });
                        }, 100);
                      }
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
                      currentTrack?.id === (group.mp3Track || group.bestTrack)?.id
                        ? 'bg-black text-white font-medium shadow-lg'
                        : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <span className={`text-xs tabular-nums w-6 shrink-0 ${currentTrack?.id === (group.mp3Track || group.bestTrack)?.id ? 'text-white/80' : 'text-muted-foreground/60 group-hover/track:text-white/80'}`}>{index + 1}.</span>
                      <span className={`text-xs tabular-nums w-10 shrink-0 ${currentTrack?.id === (group.mp3Track || group.bestTrack)?.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{formatDuration(trackDurations[(group.mp3Track || group.bestTrack)?.id] || (group.mp3Track || group.bestTrack)?.duration_seconds || (group.mp3Track || group.bestTrack)?.duration || 0)}</span>
                      <span className="truncate text-sm group-hover/track:text-white transition-colors">
                        {group.title}
                      </span>
                    </div>
                  </button>

                  <div className="ml-auto flex items-center shrink-0 gap-1">
                    {/* Track Group Download Button */}
                    {trackDownloadStatus[(group.mp3Track || group.bestTrack)?.id || ''] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info(`Downloading ${group.title}`);
                        }}
                        className="w-[32px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
                        title={`Download ${group.title}`}
                      >
                        <Download className="h-4 w-4 text-gray-400 hover:text-primary" />
                      </button>
                    )}

                    {/* Gem Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const trackForGems = group.mp3Track || group.bestTrack;
                        if (trackForGems) {
                          handleGiveGem(trackForGems.id, e);
                        }
                      }}
                      className="w-[42px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-1 group/gem"
                      title={`Give a gem to ${group.title}`}
                    >
                        <Gem
                          className={`h-4 w-4 transition-colors ${
                            (() => {
                              const trackForGems = group.mp3Track || group.bestTrack;
                              return trackForGems && (trackGems[trackForGems.id] || 0) > 0
                                ? 'text-violet-500'
                                : 'text-gray-400 hover:text-violet-500';
                            })()
                          }`}
                        />
                        <span className={`text-xs font-medium tabular-nums transition-colors ${
                            (() => {
                              const trackForGems = group.mp3Track || group.bestTrack;
                              return trackForGems && (trackGems[trackForGems.id] || 0) > 0
                                ? 'text-violet-500'
                                : 'text-gray-400 hover:text-violet-500';
                            })()
                          }`}
                        >
                          {(() => {
                            const trackForGems = group.mp3Track || group.bestTrack;
                            return trackForGems ? (trackGems[trackForGems.id] || 0) : 0;
                          })()}
                        </span>
                      </button>
                  </div>
                </div>
              </div>
            ))}
              {displayGroups.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No tracks available
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Creator Info and Action Icons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Link to={`/user/${creator.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
          </Link>
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(project.id);
                  }}
                >
                  <Bookmark className={`h-4 w-4 transition-colors ${
                    isBookmarked(project.id)
                      ? 'text-primary fill-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked(project.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 transition-all duration-300 ${
                    recentlyAddedId === project.id
                      ? 'animate-pulse ring-2 ring-primary bg-primary/20'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (project.user_id !== user?.id) {
                      setShowCartDialog(true);
                    }
                  }}
                  disabled={project.user_id === user?.id || isInCart(project.id, 'project')}
                >
                  <ShoppingCart className={`h-4 w-4 transition-colors ${
                    isInCart(project.id, 'project')
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  } ${
                    recentlyAddedId === project.id ? 'scale-110' : ''
                  }`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {project.user_id === user?.id ? (
                  <p>You can't add your own project to cart</p>
                ) : isInCart(project.id, 'project') ? (
                  <p>Project in cart</p>
                ) : (
                  <>
                    <p>Add entire project to cart</p>
                    {project.price && <p>Price: ${project.price.toFixed(2)}</p>}
                    {!project.price && audioTracks.some(t => t.price) && (
                      <p>Contains individually priced tracks</p>
                    )}
                  </>

                )}
              </TooltipContent>
            </Tooltip>
            {/* Contact Creator button removed as per request */}
            {project.allow_downloads && (
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

      {/* Project Edit Dialog */}
      {showEditDialog && (
        <ProjectEditDialog
          project={project}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onProjectUpdated={() => {
            if (onDelete) {
              onDelete();
            }
          }}
        />
      )}

      {/* Project Cart Dialog */}
      <ProjectCartDialog
        open={showCartDialog}
        onOpenChange={setShowCartDialog}
        project={project}
        audioTracks={displayGroups.map(group => group.bestTrack).filter(Boolean)}
        onAddToCart={onAddToCart || addToCart}
      />
    </>
  );
};

export default ProjectCard;
