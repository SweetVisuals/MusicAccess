import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useVisitingProfile } from "@/hooks/useVisitingProfile"
import { Profile, Project, UserStats } from "@/lib/types"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfo from "@/components/profile/ProfileInfo"
import ProfileContent from "@/components/profile/ProfileContent"
import { supabase } from "@/lib/supabase"
import { UploadDialog } from "@/components/profile/UploadDialog"
import useUserData from "@/hooks/useUserData"
import { PageLoading } from "@/components/ui/page-loading"
import { Button } from "@/components/ui/button"

type UserProfile = Profile & {
  role: string;
  streams: number;
  gems: number;
  followers: number;
  following: number;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();

  // Use the full pathname as key to force complete remount on any URL change
  // This ensures clean state when navigating between profiles
  return (
    <div className="flex-1 flex flex-col h-screen">
      <ProfilePageContent key={location.pathname} username={username || ''} />
    </div>
  );
}

function ProfilePageContent({ username }: { username: string }) {
  const { user: authUser } = useAuth()
  const { profile, stats, loading, error, refetch: refetchProfile } = useVisitingProfile(username);
  const { fetchStorageUsage } = useUserData();
  const [projects, setProjects] = useState<Project[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [uploadType, setUploadType] = useState<'avatar' | 'banner' | null>(null);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showCreateSoundpackDialog, setShowCreateSoundpackDialog] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userProfile?.id) return;
    await supabase.from('profiles').update(updates).eq('id', userProfile.id);
    refetchProfile();
    if(authUser?.id) {
      await fetchStorageUsage(authUser.id);
    }
  };

  const handleUploadSuccess = async (publicUrl: string) => {
    if (userProfile?.id && uploadType) {
      await updateProfile({
        [uploadType === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl,
      });
      refetchProfile();
      if(authUser?.id) {
        await fetchStorageUsage(authUser.id);
      }
    }
  };

  const fetchUserContent = useCallback(async () => {
    if (!profile?.id) return;

    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const isOwnProfile = authUser?.id === profile.id;

      let projectsQuery = supabase.from('projects').select(`
        *,
        profiles(*),
        audio_tracks!left(*)
      `).eq('user_id', profile.id);

      if (!isOwnProfile) {
        projectsQuery = projectsQuery.eq('visibility', 'public');
      }
      projectsQuery = projectsQuery.not('tags', 'cs', '{studio}');
      projectsQuery = projectsQuery.not('tags', 'cs', '{soundpack}');

      const { data: projectsData, error: projectsError } = await projectsQuery;

      const [
        { data: playlistsData, error: playlistsError },
        { data: albumsData, error: albumsError },
      ] = await Promise.all([
        supabase.from('playlists').select('*').eq('user_id', profile.id),
        supabase.from('albums').select('*').eq('user_id', profile.id),
      ]);

      if (projectsError) throw projectsError;
      if (playlistsError) throw playlistsError;
      if (albumsError) throw albumsError;

      // If we have projects, fetch their project_files for tracks fallback
      let projectsWithFiles = projectsData || [];
      if (projectsWithFiles.length > 0) {
        const projectIds = projectsWithFiles.map(p => p.id);

        const { data: projectFilesData, error: projectFilesError } = await supabase
          .from('project_files')
          .select('*, files!file_id(*)')
          .in('project_id', projectIds);

        if (projectFilesError) {
          console.error('Error fetching project files:', projectFilesError);
          // Continue without project_files
        } else {
          if (projectFilesData) {
            // Group project_files by project_id
            const filesByProject = projectFilesData.reduce((acc, pf) => {
              if (!acc[pf.project_id]) acc[pf.project_id] = [];
              acc[pf.project_id].push(pf);
              return acc;
            }, {});

            // Attach project_files to projects
            projectsWithFiles = projectsWithFiles.map(project => ({
              ...project,
              project_files: filesByProject[project.id] || []
            }));

            // Debug: log the enhanced projects
          }
        }
      }

      setProjects(projectsWithFiles);
      setPlaylists(playlistsData || []);
      setAlbums(albumsData || []);
    } catch (err) {
      console.error('Error fetching user content:', err);
      setProjectsError('Failed to load projects. Please try again.');
    } finally {
      setProjectsLoading(false);
    }
  }, [profile?.id, authUser?.id]);

  useEffect(() => {
    fetchUserContent();
  }, [fetchUserContent]);

  useEffect(() => {
    if (profile && stats) {
      setUserProfile({
        ...profile,
        role: (profile as any).professional_title || 'Artist',
        streams: stats.streams || 0,
        gems: stats.gems || 0,
        followers: stats.followers || 0,
        following: stats.following || 0,
      });
    } else {
      setUserProfile(null);
    }
  }, [profile, stats]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    const isNotFound = error.includes('User not found');
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
    <div className="h-screen overflow-auto">
      <div className="flex flex-col">
        <ProfileHeader
          user={authUser}
          profile={userProfile}
          updateProfile={updateProfile}
          setUploadType={setUploadType}
          openCreateProjectDialog={() => setShowCreateProjectDialog(true)}
          openCreateSoundpackDialog={() => setShowCreateSoundpackDialog(true)}
          onProfileUpdate={refetchProfile}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
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
          {projectsError ? (
            <div className="text-center p-6 bg-destructive/10 border border-destructive rounded-lg">
              <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Projects</h3>
              <p className="text-muted-foreground">{projectsError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fetchUserContent()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <ProfileContent
              user={userProfile}
              projects={projects}
              playlists={playlists}
              albums={albums}
              showCreateProjectDialog={showCreateProjectDialog}
              setShowCreateProjectDialog={setShowCreateProjectDialog}
              showCreateSoundpackDialog={showCreateSoundpackDialog}
              setShowCreateSoundpackDialog={setShowCreateSoundpackDialog}
              onProjectCreated={fetchUserContent}
              isOwner={(authUser?.id === userProfile?.id) && !isPreviewMode}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              isPreviewMode={isPreviewMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
