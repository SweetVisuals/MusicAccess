import { useState, useEffect } from 'react';
import { UserProfile, Project } from '@/lib/types';
import TrackCard from '../music/TrackCard';
import { Button } from '@/components/ui/button';
import { Plus, Music } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface TracksTabProps {
  user: UserProfile;
  projects: Project[];
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  onProjectCreated: () => void;
}

const TracksTab = ({ user, projects, viewMode = 'grid', sortBy = 'latest', showCreateDialog, setShowCreateDialog, onProjectCreated }: TracksTabProps) => {
  const [tracks, setTracks] = useState<any[]>([]);

  // Extract all tracks from projects
  useEffect(() => {
    const allTracks = projects.flatMap(project =>
      (project.audio_tracks || []).map(track => ({
        ...track,
        projectTitle: project.title,
        artworkUrl: project.cover_image_url,
        isPopular: project.isPopular || false,
        streams: Math.floor(Math.random() * 10000) + 100, // Mock data for now
      }))
    );
    setTracks(allTracks);
  }, [projects]);

  // Sort tracks based on sortBy parameter
  let sortedTracks = [...tracks];
  if (sortBy === 'latest') {
    sortedTracks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  if (sortBy === 'oldest') {
    sortedTracks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  // Add 'popular' sorting if you have a metric

  if (!tracks.length) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No tracks found</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Upload some tracks to your projects to see them here.
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tracks</h2>
      </div>

      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {sortedTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            variant={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default TracksTab;