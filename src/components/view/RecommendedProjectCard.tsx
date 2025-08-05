import { type Project } from '@/lib/types';
import { Link } from 'react-router-dom';

interface RecommendedProjectCardProps {
  project: Project;
}

const RecommendedProjectCard = ({ project }: RecommendedProjectCardProps) => {
  return (
    <Link to={`/view/${project.id.slice(-12)}`} className="block p-4 border rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-start space-x-4">
        <img
          src={project.cover_image_url || '/placeholder.svg'}
          alt={project.title}
          className="w-20 h-20 rounded-md object-cover"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-lg line-clamp-2">{project.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {project.profiles?.username || 'Unknown Artist'}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default RecommendedProjectCard;
