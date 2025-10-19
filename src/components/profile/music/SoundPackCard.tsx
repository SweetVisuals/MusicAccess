import { Download, MoreVertical, Plus, User, Tag, MessageSquare, ShoppingCart, Gem, Trash2, FileUp, Bookmark, Edit, Play, Music } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useCart } from '@/contexts/cart-context';
import { formatDuration } from '@/lib/utils';
import { type Project } from '@/lib/types';

interface SoundPack {
  id: string;
  title: string;
  trackCount: number;
  artworkUrl: string;
  tracks?: Track[];
  user_id?: string;
  creator_username?: string;
  price?: number;
  allow_downloads?: boolean;
  contract_url?: string;
  profiles?: {
    full_name?: string;
    username?: string;
    avatarUrl?: string;
    professional_title?: string;
  };
}

interface SoundPackCardProps {
  soundPack: SoundPack;
  variant?: 'grid' | 'list';
  id: string;
  onDelete?: () => void;
  showTracks?: boolean;
  onAddToCart?: (entityId: string, entityType: 'track' | 'project' | 'service' | 'playlist', quantity?: number) => Promise<void>;
}

const SoundPackCard = ({ soundPack, variant, id, onDelete, onAddToCart }: SoundPackCardProps) => {
  const navigate = useNavigate();
  const { currentTrack, playTrack } = useAudioPlayer();
  const { user } = useAuth();
  const { addToCart, addTrackToCart, isInCart, recentlyAddedId } = useCart();
  const [trackGems, setTrackGems] = useState<Record<string, number>>({});
  const [trackDownloadStatus, setTrackDownloadStatus] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchedTracks, setFetchedTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const audioTracks = useMemo(() => {
    return soundPack.tracks || fetchedTracks;
  }, [soundPack.tracks, fetchedTracks]);

  // Fetch tracks on mount if not already available
  useEffect(() => {
    if (!soundPack.tracks && fetchedTracks.length === 0) {
      const fetchTracks = async () => {
        setLoadingTracks(true);
        try {
          // Fetch playlist tracks
          const { data: playlistTracks, error: tracksError } = await supabase
            .from('playlist_tracks')
            .select('track_id, position')
            .eq('playlist_id', soundPack.id)
            .order('position');

          if (tracksError) throw tracksError;

          if (playlistTracks && playlistTracks.length > 0) {
            const trackIds = playlistTracks.map((pt: any) => pt.track_id);

            // Fetch track details from files table
            const { data: tracksData, error: filesError } = await supabase
              .from('files')
              .select('*')
              .in('id', trackIds);

            if (filesError) throw filesError;

            // Map to Track format
            const tracks: Track[] = tracksData?.map((trackData: any) => ({
              id: trackData.id,
              title: trackData.name || `Track ${trackData.id}`,
              audio_url: trackData.file_url || '',
              allow_download: false, // Default to false for uploaded files
              price: undefined, // No price for uploaded files
              duration: 0, // Duration not stored in files table
              project_id: '', // No project_id for uploaded files
              user_id: trackData.user_id,
              created_at: trackData.created_at,
              updated_at: trackData.updated_at
            })) || [];

            setFetchedTracks(tracks);
          }
        } catch (error) {
          console.error('Error fetching tracks for sound pack:', error);
        } finally {
          setLoadingTracks(false);
        }
      };

      fetchTracks();
    }
  }, [soundPack.tracks, fetchedTracks.length, soundPack.id]);

  const creator = {
    name: soundPack.profiles?.full_name || soundPack.creator_username || 'Creator',
    username: soundPack.profiles?.username || soundPack.creator_username || '',
    avatar: soundPack.profiles?.avatarUrl || '',
    professional_title: soundPack.profiles?.professional_title || 'User',
  };

  // Fetch gem counts for tracks
  useEffect(() => {
    let isMounted = true;

    const fetchTrackGemCounts = async () => {
      try {
        if (!audioTracks || audioTracks.length === 0) {
          setTrackGems({});
          return;
        }

        const trackIds = audioTracks.map(track => track.id).filter(id => id);
        if (trackIds.length === 0) {
          setTrackGems({});
          return;
        }

        const { data: gemEvents, error: gemEventsError } = await supabase
          .from('analytics')
          .select('track_id')
          .eq('event_type', 'gem_given')
          .in('track_id', trackIds);

        if (gemEventsError) {
          console.error('Error fetching gem counts:', gemEventsError);
          return;
        }

        const counts: Record<string, number> = {};
        audioTracks.forEach(track => {
          if (track.id) {
            counts[track.id] = 0;
          }
        });

        if (gemEvents) {
          gemEvents.forEach((event: any) => {
            if (event.track_id && counts.hasOwnProperty(event.track_id)) {
              counts[event.track_id]++;
            }
          });
        }

        if (isMounted) setTrackGems(counts);
      } catch (error) {
        console.error('Error in fetchTrackGemCounts:', error);
      }
    };

    fetchTrackGemCounts();

    return () => {
      isMounted = false;
    };
  }, [audioTracks]);

  useEffect(() => {
    const fetchTrackDownloadStatus = async () => {
      if (!audioTracks || audioTracks.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      const trackIds = audioTracks.map(track => track.id).filter(id => id);
      if (trackIds.length === 0) {
        setTrackDownloadStatus({});
        return;
      }

      try {
        const downloadStatus: Record<string, boolean> = {};
        audioTracks.forEach(track => {
          downloadStatus[track.id] = track.allow_download || false;
        });

        setTrackDownloadStatus(downloadStatus);
      } catch (error) {
        console.error('Error fetching track download status:', error);
      }
    };

    fetchTrackDownloadStatus();
  }, [audioTracks]);

  const handleGiveGem = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to give gems");
      return;
    }

    try {
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

      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ gems: statsData.gems - 1 })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: analyticsError } = await supabase
        .from('analytics')
        .insert([{
          event_type: 'gem_given',
          user_id: user.id,
          track_id: trackId,
          data: { sound_pack_id: soundPack.id }
        }]);

      if (analyticsError) throw analyticsError;

      setTrackGems(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));

      window.dispatchEvent(new CustomEvent('gem-balance-update'));
      toast.success("Gem given successfully!");
    } catch (error) {
      console.error('Error giving gem:', error);
      toast.error("Failed to give gem");
    }
  };

  const handleDeleteSoundPack = async () => {
    if (!user) {
      toast.error("Please sign in to delete sound packs");
      return;
    }

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', soundPack.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Sound pack deleted successfully");

      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting sound pack:', error);
      toast.error("Failed to delete sound pack");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id={id}
      className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md text-left"
    >
      {/* Full width cover image */}
      <div className="relative w-full h-32 overflow-hidden">
        {soundPack.artworkUrl && soundPack.artworkUrl !== 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg' ? (
          <img
            src={soundPack.artworkUrl}
            alt={soundPack.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="icon" className="rounded-full w-10 h-10">
            <Play className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white">
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
              {user && user.id === soundPack.user_id && (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={handleDeleteSoundPack}
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

      {/* Sound Pack Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium line-clamp-1">{soundPack.title}</h3>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {audioTracks.length || 0} track{(audioTracks.length || 0) !== 1 ? 's' : ''}
              </div>
              {soundPack.price && soundPack.price > 0 && (
                <Badge variant="secondary" className="text-xs">
                  ${soundPack.price.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      {loadingTracks ? (
        <div className="px-4 pb-4">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading tracks...</p>
          </div>
        </div>
      ) : audioTracks.length > 0 ? (
        <>
          <div className="px-4 pb-4">
            <div className="max-h-40 overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {audioTracks.slice(0, 10).map((track, index) => (
                <div key={track.id} className="flex items-center">
                  <div className="flex items-center w-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        playTrack({
                          ...track,
                          title: track.title ? track.title.replace(/\.[^/.]+$/, "") : '',
                          audioUrl: track.audio_url,
                          projectTitle: soundPack.title,
                          artworkUrl: soundPack.artworkUrl,
                          duration: track.duration || 0,
                        });
                        setTimeout(() => {
                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: 'smooth'
                          });
                        }, 100);
                      }}
                      onPointerDown={(e) => {
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
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <span className={`text-xs tabular-nums w-6 shrink-0 ${currentTrack?.id === track.id ? 'text-white/80' : 'text-muted-foreground/60 group-hover/track:text-white/80'}`}>{index + 1}.</span>
                        <span className={`text-xs tabular-nums w-10 shrink-0 ${currentTrack?.id === track.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{formatDuration(track.duration || 0)}</span>
                        <span className="truncate text-sm group-hover/track:text-white transition-colors">
                          {track.title ? track.title.replace(/\.[^/.]+$/, "") : ''}
                        </span>
                      </div>
                    </button>

                    <div className="ml-auto flex items-center shrink-0 gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (soundPack.user_id !== user?.id) {
                                addTrackToCart({
                                  id: track.id,
                                  title: track.title ? track.title.replace(/\.[^/.]+$/, "") : 'Track',
                                  price: track.price || 0,
                                  producer_name: creator.username,
                                  producer_avatar_url: creator.avatar
                                });
                                toast.success(`${track.title ? track.title.replace(/\.[^/.]+$/, "") : 'Track'} added to cart`, {
                                  description: track.price
                                    ? `Track price: $${track.price.toFixed(2)}`
                                    : 'Free track'
                                });
                              }
                            }}
                            disabled={soundPack.user_id === user?.id || isInCart(track.id, 'track')}
                            className={`w-[32px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center transition-all duration-300 ${
                              recentlyAddedId === track.id
                                ? 'animate-pulse ring-2 ring-primary bg-primary/20'
                                : ''
                            }`}
                            title={`Add ${track.title ? track.title.replace(/\.[^/.]+$/, "") : 'track'} to cart`}
                          >
                            <ShoppingCart className={`h-4 w-4 transition-colors ${
                              isInCart(track.id, 'track')
                                ? 'text-primary'
                                : 'text-gray-400 hover:text-primary'
                            } ${
                              recentlyAddedId === track.id ? 'scale-110' : ''
                            }`} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {soundPack.user_id === user?.id ? (
                            <p>You can't add your own track to cart</p>
                          ) : isInCart(track.id, 'track') ? (
                            <p>Track in cart</p>
                          ) : (
                            <>
                              <p>Add track to cart</p>
                              {track.price && <p>Price: ${track.price.toFixed(2)}</p>}
                              {!track.price && <p>Free track</p>}
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>

                      {trackDownloadStatus[track.id] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(`Downloading ${track.title}`);
                          }}
                          className="w-[32px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
                          title={`Download ${track.title ? track.title.replace(/\.[^/.]+$/, "") : ''}`}
                        >
                          <Download className="h-4 w-4 text-gray-400 hover:text-primary" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
              {audioTracks.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No tracks available
                </div>
              )}
            </div>
          </div>

          {/* Creator Info and Action Icons */}
          <div className="flex items-center justify-between px-4 pb-4 pt-4 border-t">
            <Link to={`/user/${creator.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-6 w-6">
                <AvatarImage src={creator.avatar} alt={creator.name} />
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
              {soundPack.price && soundPack.price > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 transition-all duration-300 ${
                        recentlyAddedId === soundPack.id
                          ? 'animate-pulse ring-2 ring-primary bg-primary/20'
                          : ''
                      }`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (soundPack.user_id !== user?.id) {
                          try {
                            if (onAddToCart) {
                              await onAddToCart(soundPack.id, 'playlist');
                            } else {
                              await addToCart(soundPack.id, 'playlist');
                            }
                            toast.success(`${soundPack.title} added to cart`, {
                              description: `Sound pack price: $${soundPack.price?.toFixed(2)}`
                            });
                          } catch (error) {
                            console.error('Error adding sound pack to cart:', error);
                            toast.error('Failed to add sound pack to cart');
                          }
                        }
                      }}
                      disabled={soundPack.user_id === user?.id || isInCart(soundPack.id, 'playlist')}
                    >
                      <ShoppingCart className={`h-4 w-4 transition-colors ${
                        isInCart(soundPack.id, 'playlist')
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      } ${
                        recentlyAddedId === soundPack.id ? 'scale-110' : ''
                      }`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {soundPack.user_id === user?.id ? (
                      <p>You can't add your own sound pack to cart</p>
                    ) : isInCart(soundPack.id, 'playlist') ? (
                      <p>Sound pack in cart</p>
                    ) : (
                      <div>
                        <p>Add sound pack to cart</p>
                        <p>Price: ${soundPack.price.toFixed(2)}</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="px-4 pb-4">
          <div className="text-center py-4 text-sm text-muted-foreground">
            No tracks available
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundPackCard;
