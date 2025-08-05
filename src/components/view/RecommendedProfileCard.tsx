import { type Profile } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecommendedProfileCardProps {
  profile: Profile;
}

const RecommendedProfileCard = ({ profile }: RecommendedProfileCardProps) => {
  return (
    <Link to={`/user/${profile.username}`} className="block p-4 border rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatarUrl} alt={profile.username} />
          <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{profile.username}</h4>
          <p className="text-sm text-muted-foreground">{profile.professional_title || 'Music Professional'}</p>
        </div>
      </div>
    </Link>
  );
};

export default RecommendedProfileCard;
