import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Profile } from '@/lib/types';

interface ProfileCardProps {
  profile: Profile;
  id: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, id }) => {
  return (
    <Link to={`/user/${profile.username}`}>
      <Card id={id} className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4 flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl || ''} alt={profile.full_name} />
            <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{profile.full_name}</h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProfileCard;