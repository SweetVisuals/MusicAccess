import { type Project } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecommendedProjectCardProps {
  project: Project;
}

const RecommendedProjectCard = ({ project }: RecommendedProjectCardProps) => {
  return (
    <Link to={`/view/${project.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors">
      <img
        src={project.cover_image_url || '/placeholder.svg'}
        alt={project.title}
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="flex-1">
        <div className="font-semibold line-clamp-1">{project.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={project.profiles?.avatarUrl} />
            <AvatarFallback>{project.profiles?.username?.[0]}</AvatarFallback>
          </Avatar>
          <span>{project.profiles?.username || 'Unknown Artist'}</span>
        </div>
      </div>
    </Link>
  );
};

export default RecommendedProjectCard;
