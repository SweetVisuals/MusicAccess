import { type Project, type Track } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Play, MessageSquare, Share2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectViewProps {
  project: Project;
}

const ProjectView = ({ project }: ProjectViewProps) => {
  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});
  const { addToCart } = useCart();

  const handleAddTrackToCart = (track: Track) => {
    addToCart(track.id, 'track');
    toast.success(`${track.title} added to cart`);
  };

  const handleAddProjectToCart = () => {
    addToCart(project.id, 'project');
    toast.success(`${project.title} added to cart`);
  };

  useEffect(() => {
    const fetchStreamCounts = async () => {
      if (!project?.tracks || project.tracks.length === 0) return;

      const trackIds = project.tracks.map(t => t.id);
      const { data, error } = await supabase
        .from('track_streams')
        .select('track_id, id')
        .in('track_id', trackIds);

      if (error) {
        console.error('Error fetching stream counts:', error);
        return;
      }

      const counts = data.reduce((acc, { track_id }) => {
        if (track_id) {
          acc[track_id] = (acc[track_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      setStreamCounts(counts);
    };

    fetchStreamCounts();
  }, [project]);

  if (!project) return null;

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="md:col-span-1 p-6 flex flex-col items-center text-center">
          <img
            src={project.cover_image_url || '/placeholder.svg'}
            alt={project.title}
            className="w-full h-auto rounded-lg shadow-md mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.profiles?.avatarUrl} />
              <AvatarFallback>{project.profiles?.username?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-lg text-muted-foreground">{project.profiles?.username || 'Unknown Artist'}</span>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {project.tags?.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 p-6 bg-background/50">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Tracklist</h2>
          <div className="space-y-2">
            {project.tracks?.map(track => (
              <div key={track.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Play className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="font-semibold">{track.title.replace(/\.[^/.]+$/, "")}</div>
                    <div className="text-sm text-muted-foreground">{streamCounts[track.id] || 0} streams</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg">${track.price || '2.99'}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleAddTrackToCart(track)}>
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-6 pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-3xl font-bold text-primary">${project.price || '29.99'}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Message Creator
                </Button>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={handleAddProjectToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add Project to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
