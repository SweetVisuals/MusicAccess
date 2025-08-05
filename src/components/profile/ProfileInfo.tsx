import type { Profile } from '@/lib/types';
import { Skeleton } from '@/components/@/ui/skeleton';

interface ProfileInfoProps {
  profile?: Profile | null;
  isLoading?: boolean;
}

const ProfileInfo = ({ profile, isLoading = false }: ProfileInfoProps) => {
  if (isLoading) {
    return (
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <div className="px-6 max-w-7xl mx-auto">
      
    </div>
  );
};

export default ProfileInfo;
