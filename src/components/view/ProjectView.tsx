import React, { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { useAudioPlayer } from '@/contexts/audio-player-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { toast } from 'sonner';
import { Gem, Download, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectViewProps {
  project: Project;
  onAddToCart: () => void; // Add onAddToCart prop
  onDownload: () => void; // Add onDownload prop
  allowDownloads: boolean; // Add allowDownloads prop
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onAddToCart, onDownload, allowDownloads }) => {
  const { currentTrack, playTrack } = useAudioPlayer();
  const { user } = useAuth();
  const { isInCart, addToCart, addTrackToCart, recentlyAddedId } = useCart();
  const [trackGems, setTrackGems] = useState<Record<string, number>>({});
  const [trackDownloadStatus, setTrackDownloadStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTrackData = async () => {
      if (!project.audio_tracks || project.audio_tracks.length === 0) {
        setTrackGems({});
        setTrackDownloadStatus({});
        return;
      }

      const trackIds = project.audio_tracks.map(track => track.id);

      // Fetch gem counts
      const { data: gemEvents } = await supabase
        .from('analytics')
        .select('track_id')
        .eq('event_type', 'gem_given')
        .in('track_id', trackIds);

      const counts: Record<string, number> = {};
      project.audio_tracks.forEach(track => {
        counts[track.id] = 0;
      });
      if (gemEvents) {
        gemEvents.forEach(event => {
          if (event.track_id) {
            counts[event.track_id]++;
          }
        });
      }
      setTrackGems(counts);

      // Fetch download status
      const { data: tracksData } = await supabase
        .from('audio_tracks')
        .select('id, allow_download')
        .in('id', trackIds);

      if (tracksData) {
        const downloadStatus: Record<string, boolean> = {};
        tracksData.forEach(track => {
          downloadStatus[track.id] = track.allow_download;
        });
        setTrackDownloadStatus(downloadStatus);
      }
    };

    fetchTrackData();
  }, [project.audio_tracks]);

  const handleGiveGem = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return toast.error("Please sign in to give gems");

    const { data: statsData, error: statsError } = await supabase
      .from('user_stats').select('gems').eq('user_id', user.id).single();
    if (statsError || !statsData || statsData.gems <= 0) {
      return toast.error("You don't have any gems to give");
    }

    await supabase.from('user_stats').update({ gems: statsData.gems - 1 }).eq('user_id', user.id);
    await supabase.from('analytics').insert([{ event_type: 'gem_given', user_id: user.id, track_id: trackId, data: { project_id: project.id } }]);
    
    setTrackGems(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 }));
    window.dispatchEvent(new CustomEvent('gem-balance-update'));
    toast.success("Gem given successfully!");
  };

  const handleTrackAddToCart = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    addTrackToCart({
      id: track.id,
      title: track.title?.replace(/\.[^/.]+$/, "") || 'Track',
      price: track.price || 0,
      producer_name: project.profiles?.username,
      producer_avatar_url: project.profiles?.avatarUrl
    });
    toast.success(`Track added to cart`);
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center justify-between w-full"> {/* Added flex for title and button */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
            <p className="text-muted-foreground">{project.description}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {project.audio_tracks?.length || 0} track{project.audio_tracks?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2"> {/* Container for action buttons */}
            <Button onClick={onAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            {allowDownloads && (
              <Button variant="outline" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" /> Download Project
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="max-h-96 overflow-y-auto space-y-0.5 p-1 scrollbar-thin">
          {project.audio_tracks && project.audio_tracks.length > 0 ? (
            project.audio_tracks.map((track, index) => (
              <div key={track.id} className="flex items-center p-2 rounded-md hover:bg-muted">
                <button
                  onClick={() => playTrack({ 
                    ...track, 
                    duration: track.duration || 0, 
                    projectTitle: project.title, 
                    artworkUrl: project.cover_image_url
                  })}
                  className="flex-grow flex items-center gap-3 text-left"
                >
                  <span className="text-xs tabular-nums w-5 text-muted-foreground">{index + 1}.</span>
                  <span className="truncate text-sm font-medium">
                    {track.title.replace(/\.[^/.]+$/, "")}
                  </span>
                </button>
                <div className="ml-auto flex items-center shrink-0 gap-2">
                  {project.user_id !== user?.id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleTrackAddToCart(e, track)}
                      disabled={isInCart(track.id, 'track')} 
                      title={`Add ${track.title ? track.title.replace(/\.[^/.]+$/, "") : 'Track'} to cart`}
                      className={`transition-all duration-300 ${
                        recentlyAddedId === track.id 
                          ? 'animate-pulse ring-2 ring-primary bg-primary/20' 
                          : ''
                      }`}
                    >
                      <ShoppingCart className={`h-4 w-4 transition-colors ${
                        isInCart(track.id, 'track') ? 'text-primary' : 'text-gray-400 hover:text-primary'
                      } ${
                        recentlyAddedId === track.id ? 'scale-110' : ''
                      }`} />
                    </Button>
                  )}
                  {trackDownloadStatus[track.id] && (
                    <Button variant="ghost" size="icon" title="Download track">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" title="Give a gem" onClick={(e) => handleGiveGem(track.id, e)}>
                    <Gem className={`h-4 w-4 transition-colors ${(trackGems[track.id] || 0) > 0 ? 'text-violet-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <span className="text-xs font-medium tabular-nums w-4 text-muted-foreground">
                    {trackGems[track.id] || 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No tracks in this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
