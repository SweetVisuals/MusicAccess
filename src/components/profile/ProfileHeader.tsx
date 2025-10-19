import { useState, useEffect } from 'react';
import { PlayCircle, Users, Gem, MessageCircle, UserPlus, Camera, MapPin, Calendar, Globe, Settings, Loader2, AlertCircle, Plus, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { SettingsDialog } from '@/components/settings-dialog';
import { DialogTrigger } from '@/components/ui/dialog';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import useProfile from '@/hooks/useProfile';
import { useFollowingStore } from '@/hooks/useFollowing';
import { useMessaging } from '@/contexts/messaging-context';

interface ProfileHeaderProps {
  user: User | null;
  profile?: (Profile & { streams?: number; gems?: number; followers?: number; following?: number; }) | null;
  updateProfile?: (updates: Partial<Profile>) => Promise<void>;
  setUploadType?: (type: 'avatar' | 'banner' | null) => void;
  openCreateProjectDialog?: () => void;
  openCreateSoundpackDialog?: () => void;
  onProfileUpdate?: () => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
}

const ProfileHeader = ({
  user,
  profile,
  updateProfile = async () => {},
  setUploadType = () => {},
  openCreateProjectDialog = () => {},
  openCreateSoundpackDialog = () => {},
  onProfileUpdate,
  isPreviewMode = false,
  onTogglePreview = () => {}
}: ProfileHeaderProps) => {
  const name = profile?.full_name || '';
  const isOwner = user?.id === profile?.id;
  const { id: profileId } = profile || {};
  const { id: authUserId } = user || {};
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(profile?.followers || 0);
  const [followingCount, setFollowingCount] = useState(profile?.following || 0);
  const effectiveIsOwner = isOwner && !isPreviewMode;
  const { fetchProfile } = useProfile();
  const { fetchFollowing } = useFollowingStore();
  const { openMessaging } = useMessaging();


  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!authUserId || !profileId || isOwner) return;
      const { data, error } = await supabase.rpc('is_following', { profile_id_to_check: profileId });
      if (error) {
        console.error('Error checking following status:', error);
      } else {
        setIsFollowing(data);
      }
    };

    checkFollowingStatus();
  }, [authUserId, profileId, isOwner]);

  useEffect(() => {
    setFollowersCount(profile?.followers || 0);
    setFollowingCount(profile?.following || 0);
  }, [profile]);

  const handleFollow = async () => {
    if (!authUserId || !profileId || isOwner) return;

    const functionName = isFollowing ? 'unfollow' : 'follow';
    const { error } = await supabase.rpc(functionName, { [`profile_id_to_${functionName}`]: profileId });

    if (error) {
      console.error(`Error ${functionName}ing user:`, error);
    } else {
      setIsFollowing(!isFollowing);
      // Update follower count immediately for live updates
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      // Refetch profile to get updated follower count (for consistency)
      if (profileId) {
        fetchProfile(profileId);
      }
      if (authUserId) {
        fetchFollowing(authUserId);
      }
    }
  };

  const bannerUrl = profile?.bannerUrl || '';
  const avatarUrl = profile?.avatarUrl || '';
  const hasAvatar = !!avatarUrl && avatarUrl !== '/default-avatar.png';
  const hasBanner = !!bannerUrl && bannerUrl !== '/default-banner.jpg';

  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerError, setBannerError] = useState(false);

  useEffect(() => {
    setAvatarLoading(true);
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    setBannerLoading(true);
    setBannerError(false);
  }, [bannerUrl]);

  const handleAvatarLoad = () => setAvatarLoading(false);
  const handleAvatarError = () => {
    setAvatarLoading(false);
    setAvatarError(true);
    console.error('Error loading avatar image:', avatarUrl);
  };

  const handleBannerLoad = () => setBannerLoading(false);
  const handleBannerError = () => {
    setBannerLoading(false);
    setBannerError(true);
    console.error('Error loading banner image:', bannerUrl);
  };

  return (
    <>
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 w-full overflow-hidden relative mb-20" style={{ cursor: isOwner ? 'pointer' : 'default' }}>
          {hasBanner ? (
            <>
              {bannerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 animate-fade-in transition-all duration-300">
                  <Loader2 className="h-12 w-12 text-gray-400 opacity-40 animate-spin" />
                </div>
              )}
              {bannerError && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 animate-fade-in transition-all duration-300 text-red-300">
                   <AlertCircle className="h-12 w-12 opacity-60 mb-2" />
                   <span className="text-sm opacity-60">Error loading banner</span>
                 </div>
              )}
              {!bannerError && (
                <img
                  src={`${bannerUrl}?v=${profile?.updatedAt ? new Date(profile.updatedAt).getTime() : ''}&t=${Date.now()}`} // Add more aggressive cache-busting
                  alt="Profile banner"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${bannerLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={handleBannerLoad}
                  onError={handleBannerError}
                  crossOrigin="anonymous"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-700 animate-fade-in flex items-center justify-center transition-all duration-300">
              <Camera className="h-12 w-12 text-gray-400 opacity-40" />
            </div>
          )}
          {effectiveIsOwner && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-90 transition-opacity duration-300 bg-black/30"
              onClick={() => setUploadType('banner')}
            >
              <Camera className="h-10 w-10 text-gray-200" />
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 w-full -mt-12">
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-8xl mx-auto">
            {/* Avatar */}
            <div className="relative ml-0 group shrink-0">
              <div
                className="h-32 w-32 rounded-full border-4 border-background overflow-hidden relative"
                style={{ cursor: isOwner ? 'pointer' : 'default' }}
              >
                {hasAvatar ? (
                  <>
                    {avatarLoading && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-500 animate-fade-in transition-all duration-300">
                        <Loader2 className="h-10 w-10 text-gray-300 opacity-40 animate-spin" />
                      </div>
                    )}
                     {avatarError && (
                       <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-red-900/20 animate-fade-in transition-all duration-300 text-red-300">
                         <AlertCircle className="h-10 w-10 opacity-60 mb-1" />
                         <span className="text-xs opacity-60">Error</span>
                       </div>
                    )}
                    {!avatarError && (
                      <img
                        src={`${avatarUrl}?v=${profile?.updatedAt ? new Date(profile.updatedAt).getTime() : ''}&t=${Date.now()}`} // Add more aggressive cache-busting
                        alt={name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={handleAvatarLoad}
                        onError={handleAvatarError}
                        crossOrigin="anonymous"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-500 animate-fade-in flex items-center justify-center transition-all duration-300">
                    <Camera className="h-10 w-10 text-gray-300 opacity-40" />
                  </div>
                )}
                {effectiveIsOwner && (
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-90 transition-opacity duration-300 bg-black/30"
                    onClick={() => setUploadType('avatar')}
                  >
                    <Camera className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-0 min-w-0">
              <div className="flex justify-between items-start w-full">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {name && (
                      <h1 className="text-2xl font-bold truncate">{name}</h1>
                    )}
                    {isOwner && (
                      <button
                        onClick={onTogglePreview}
                        className="p-1 hover:bg-accent rounded-full transition-colors"
                        title={isPreviewMode ? 'Exit preview mode' : 'Preview as guest'}
                      >
                        {isPreviewMode ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-6 pt-2 pb-2">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{profile?.streams?.toLocaleString() || '0'}</span>
                      <span className="text-xs text-muted-foreground">Streams</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">{followersCount.toLocaleString() || '0'}</span>
                      <span className="text-xs text-muted-foreground">Followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gem className="h-4 w-4 text-primary" />
                      <span className="text-sm">{profile?.gems || '0'}</span>
                      <span className="text-xs text-muted-foreground">Gems</span>
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="text-xs pt-2 pb-2 text-muted-foreground max-w-2xl whitespace-nowrap overflow-hidden text-ellipsis">
                      {profile?.bio}
                    </p>
                  )}

                  {/* Profile Info Tags */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile?.location && (
                      <Button variant="outline" size="sm" className="rounded-full">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {profile?.location}
                      </Button>
                    )}
                    {profile?.website_url && (
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Globe className="h-3.5 w-3.5 mr-1" />
                        {profile?.website_url}
                      </Button>
                    )}
                    {profile && (
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Joined {format(new Date(profile?.createdAt || new Date()), 'MMMM yyyy')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mr-10">
                  {!effectiveIsOwner ? (
                    <>
                      <Button variant="outline" onClick={() => profile && openMessaging(profile)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" onClick={handleFollow}>
                        {isFollowing ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <SettingsDialog onProfileUpdate={onProfileUpdate} profile={profile}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                      </SettingsDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
