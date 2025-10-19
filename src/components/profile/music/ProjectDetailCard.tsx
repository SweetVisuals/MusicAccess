import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/@/ui/dialog';
import { type Project, type Track } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/@/ui/badge';
import { Button } from '@/components/@/ui/button';
import { ShoppingCart, Play, MessageSquare } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface ProjectDetailCardProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ProjectDetailCard = ({ project, isOpen, onOpenChange }: ProjectDetailCardProps) => {
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});
  const { addToCart, addTrackToCart, recentlyAddedId } = useCart();
  const { user } = useAuth();

  const handleAddTrackToCart = (track: Track) => {
    addTrackToCart({
      id: track.id,
      title: track.title?.replace(/\.[^/.]+$/, "") || 'Track',
      price: track.price || 0,
      producer_name: project.profiles?.username,
      producer_avatar_url: project.profiles?.avatarUrl
    });
    toast.success(`${track.title} added to cart`);
  };

  const handleAddProjectToCart = () => {
    if (project.user_id === user?.id) {
      toast.error("You can't add your own project to the cart.");
      return;
    }
    addToCart(project.id, 'project');
    toast.success(`${project.title} added to cart`);
  };

  useEffect(() => {
    const fetchStreamCounts = async () => {
      if (!project?.audio_tracks || project.audio_tracks.length === 0) return;

      const trackIds = project.audio_tracks.map((t: Track) => t.id);
      const { data, error } = await supabase
        .from('track_streams')
        .select('track_id, streams')
        .in('track_id', trackIds);

      if (error) {
        console.error('Error fetching stream counts:', error);
        return;
      }

      const counts = data.reduce((acc, { track_id, streams }) => {
        if (track_id) {
          acc[track_id] = (acc[track_id] || 0) + (streams || 0);
        }
        return acc;
      }, {} as Record<string, number>);

      setStreamCounts(counts);
    };

    if (isOpen) {
      fetchStreamCounts();
    }
  }, [project, isOpen]);

  if (!project) return null;

  const totalStreams = Object.values(streamCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">{project.title}</DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            By {project.profiles?.username || 'Unknown Artist'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg">Tracks</h4>
              <div className="mt-2 space-y-2">
                {project.audio_tracks?.map((track: Track) => (
                  <div key={track.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Play className="h-5 w-5 text-muted-foreground" />
                      <span>{track.title?.replace(/\.[^/.]+$/, "") || 'Untitled Track'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {streamCounts[track.id] || 0} streams
                      </span>
                      <Badge variant="outline">$2.99</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleAddTrackToCart(track)}
                        className={`transition-all duration-300 ${
                          recentlyAddedId === track.id 
                            ? 'animate-pulse ring-2 ring-primary bg-primary/20' 
                            : ''
                        }`}
                      >
                        <ShoppingCart className={`h-5 w-5 transition-colors ${
                          recentlyAddedId === track.id ? 'scale-110' : ''
                        }`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-primary">${project.price || '29.99'}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  size="lg" 
                  className={`flex-1 transition-all duration-300 ${
                    recentlyAddedId === project.id 
                      ? 'animate-pulse ring-2 ring-primary bg-primary/20' 
                      : ''
                  }`}
                  onClick={handleAddProjectToCart}
                >
                  <ShoppingCart className={`mr-2 h-5 w-5 transition-transform ${
                    recentlyAddedId === project.id ? 'scale-110' : ''
                  }`} />
                  Add Project to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Message Creator
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailCard;
