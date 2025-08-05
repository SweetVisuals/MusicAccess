import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Profile, UserProfile } from '@/lib/types'; // Import UserProfile type
import { Heart, MessageCircle, Gem, Download, Play } from 'lucide-react';
import { Project } from '@/lib/types'; // Import Project type

interface UserInfoCardProps {
  user: UserProfile; // Change type to UserProfile
  project: Project; // Add project prop
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, project }) => {
  return (
    <div>
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <h3 className="text-md font-bold mr-5">{user.username}</h3>
                <p className="text-xs text-muted-foreground">
                  {user.followers_count ?? 0} Followers
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                <Heart className="h-3 w-3" />
                Follow
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <MessageCircle className="h-3 w-3" />
                Message
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Gem className="mr-1 h-4 w-4 text-violet-500" />
                <span>0 Gems</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Play className="mr-1 h-4 w-4" />
                <span>0 Streams</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
