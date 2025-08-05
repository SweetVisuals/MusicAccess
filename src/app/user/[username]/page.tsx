import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import useProfile from "@/hooks/useProfile"
import { Profile, Project } from "@/lib/types"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfo from "@/components/profile/ProfileInfo"
import ProfileContent from "@/components/profile/ProfileContent"
import { ScrollArea } from "@/components/@/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { UploadDialog } from "@/components/profile/UploadDialog"
import useUserData from "@/hooks/useUserData"
import { PageLoading } from "@/components/ui/page-loading"
import { HomeLayout } from "@/components/layout/HomeLayout" // Import HomeLayout

type UserProfile = Profile & {
  role: string;
  streams: number;
  gems: number;
};

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const { username } = useParams<{ username: string }>()
  const { profile, stats, loading, error, updateProfile: updateProfileHook } = useProfile()
  const { fetchStorageUsage } = useUserData();
  const [projects, setProjects] = useState<Project[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [uploadType, setUploadType] = useState<'avatar' | 'banner' | null>(null);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showCreateSoundpackDialog, setShowCreateSoundpackDialog] = useState(false);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userProfile?.id) return;
    await updateProfileHook({ ...updates, id: userProfile.id });
    useProfile.getState().fetchProfile(userProfile.id);
    await fetchStorageUsage(userProfile.id);
  };

  const handleUploadSuccess = async (publicUrl: string) => {
    console.log('handleUploadSuccess called with publicUrl:', publicUrl);
    console.log('userProfile before update:', userProfile);
    if (userProfile?.id && uploadType) {
      await updateProfile({
        [uploadType === 'avatar' ? 'profile_url' : 'banner_url']: publicUrl,
      });
      console.log('userProfile after update (should be updated by hook):', profile);
      useProfile.getState().fetchProfile(userProfile.id);
      await fetchStorageUsage(userProfile.id);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        return;
      }
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();
        if (userError) {
          throw userError;
        }
        if (userData) {
          useProfile.getState().fetchProfile(userData.id);
        }
      } catch (error) {
        console.error('Error fetching user data by username:', error);
      }
    };
    fetchUserData();
  }, [username]);
  
  const fetchUserContent = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [
        { data: projectsData, error: projectsError },
        { data: playlistsData, error: playlistsError },
        { data: albumsData, error: albumsError },
      ] = await Promise.all([
        supabase.from('projects').select('*, profiles(*), audio_tracks(*)').eq('user_id', profile.id),
        supabase.from('playlists').select('*').eq('user_id', profile.id),
        supabase.from('albums').select('*').eq('user_id', profile.id),
      ]);
      if (projectsError) throw projectsError;
      if (playlistsError) throw playlistsError;
      if (albumsError) throw albumsError;
      setProjects(projectsData || []);
      setPlaylists(playlistsData || []);
      setAlbums(albumsData || []);
    } catch (err) {
      console.error('Error fetching user content:', err);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchUserContent()
  }, [fetchUserContent])
  
  useEffect(() => {
    if (profile) {
      setUserProfile({
        ...profile,
        role: profile.professional_title || 'Artist',
        streams: stats?.streams || 0,
        gems: stats?.gems || 0,
      });
    }
  }, [profile, stats]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    const isNotFound = error.includes('Profile not found');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-2">
            {isNotFound ? 'Profile Not Found' : 'Error Loading Profile'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isNotFound
              ? "The profile you are looking for does not exist."
              : "An unexpected error occurred while trying to load the profile. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <PageLoading />;
  }

  return (
    <HomeLayout>
      <ScrollArea className="h-screen">
        <div className="flex flex-col">
          <ProfileHeader
            user={authUser || { id: '' }}
            profile={userProfile}
            stats={stats || {
              user_id: userProfile.id,
              streams: userProfile.streams || 0,
              followers: 0,
              following: 0,
              gems: userProfile.gems || 0,
              tracks: projects.reduce((acc, p) => acc + (p.audio_tracks?.length || 0), 0),
              playlists: playlists.length,
              albums: albums.length
            }}
            updateProfile={updateProfile}
            setUploadType={setUploadType}
            setShowCreateProjectDialog={setShowCreateProjectDialog}
            setShowCreateSoundpackDialog={setShowCreateSoundpackDialog}
          />
          <ProfileInfo
            profile={userProfile}
            isLoading={loading}
          />
          <UploadDialog
            open={uploadType !== null}
            onOpenChange={(open) => !open && setUploadType(null)}
            onUpload={handleUploadSuccess}
            type={uploadType || undefined}
          />
          <div className="container max-w-8xl mx-auto px-4 md:px-6 -mt-6 pb-12">
            <ProfileContent
              user={userProfile}
              stats={stats || {
                user_id: userProfile.id,
                streams: userProfile.streams || 0,
                followers: 0,
                following: 0,
                gems: userProfile.gems || 0,
                tracks: projects.reduce((acc, p) => acc + (p.audio_tracks?.length || 0), 0),
                playlists: playlists.length,
                albums: albums.length
              }}
              projects={projects}
              playlists={playlists}
              albums={albums}
              showCreateProjectDialog={showCreateProjectDialog}
              setShowCreateProjectDialog={setShowCreateProjectDialog}
              showCreateSoundpackDialog={showCreateSoundpackDialog}
              setShowCreateSoundpackDialog={setShowCreateSoundpackDialog}
              onProjectCreated={fetchUserContent}
            />
          </div>
        </div>
      </ScrollArea>
    </HomeLayout>
  )
}
