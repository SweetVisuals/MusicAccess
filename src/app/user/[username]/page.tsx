import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import useProfile from "@/hooks/useProfile"
import { Profile } from "@/lib/types"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfo from "@/components/profile/ProfileInfo"
import ProfileContent from "@/components/profile/ProfileContent"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SiteHeader } from "@/components/homepage/site-header"
import { ScrollArea } from "@/components/@/ui/scroll-area"
import { SidebarInset, SidebarProvider, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from "@/components/@/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { UploadDialog } from "@/components/profile/UploadDialog" // Import UploadDialog
import useUserData from "@/hooks/useUserData" // Import useUserData

import { Settings, User, Home, Library, Mic2, Disc3, Compass, Music2, Users } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

const docItems = [
  { name: 'Profile Settings', url: '/profile/settings', icon: Settings },
  { name: 'Account', url: '/profile/account', icon: User }
];

type UserProfile = Profile & {
  role: string;
  streams: number;
  gems: number;
};

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const { username } = useParams<{ username: string }>()
  const { profile, stats, loading, error, fetchProfile, updateProfile: updateProfileHook } = useProfile() // Get updateProfile from hook
  const { fetchStorageUsage } = useUserData(); // Get fetchStorageUsage from useUserData
  const [tracks, setTracks] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [uploadType, setUploadType] = useState<'avatar' | 'banner' | null>(null); // Add uploadType state
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showCreateSoundpackDialog, setShowCreateSoundpackDialog] = useState(false);


  // Function to update profile in Supabase and local state (using the hook's function)
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userProfile?.id) return;
    await updateProfileHook({ ...updates, id: userProfile.id }); // Use the hook's updateProfile
    await fetchProfile(userProfile.id); // Refetch profile to update UI
  };


  // Handle successful upload from UploadDialog
  const handleUploadSuccess = async (publicUrl: string) => {
    console.log('handleUploadSuccess called with publicUrl:', publicUrl);
    console.log('userProfile before update:', userProfile);
    // After successful upload to Storage in UploadDialog,
    // update the profile in the database and local state using the hook's updateProfile
    if (userProfile?.id && uploadType) {
      await updateProfile({
        [uploadType === 'avatar' ? 'profile_url' : 'banner_url']: publicUrl,
      });
      console.log('userProfile after update (should be updated by hook):', profile); // Log profile from hook state
      // After updating the profile, refetch the profile data to ensure the state is updated
      await fetchProfile(userProfile.id);
      // Fetch updated storage usage after successful upload and profile update
      await fetchStorageUsage(userProfile.id);
    }
  };


  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return
      
      // Check if username is a placeholder for the current user's profile
      if (username === 'user-profile' && authUser?.id) {
        // Use the logged-in user's ID directly
        await fetchProfile(authUser.id)
        return
      }
      
      // Try to find user by username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle() // Use maybeSingle() to handle zero rows gracefully
      
      if (userError) {
        console.error('Error fetching user:', userError)
        return
      }
      
      if (!userData) {
        console.error('User not found with username:', username)
        return
      }
      
      // Now fetch the complete profile with the user ID
      await fetchProfile(userData.id)
    }
    
    fetchUserData()
  }, [username, fetchProfile, authUser?.id])
  
  // Fetch user content (tracks, playlists, albums)
  useEffect(() => {
    const fetchUserContent = async () => {
      if (!profile?.id) return
      
      try {
        // Fetch tracks
        const { data: tracksData } = await supabase
          .from('audio_tracks')
          .select('*')
          .eq('user_id', profile.id)
        
        if (tracksData) setTracks(tracksData)
        
        // Fetch playlists
        const { data: playlistsData } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', profile.id)
        
        if (playlistsData) setPlaylists(playlistsData)
        
        // Fetch albums
        const { data: albumsData } = await supabase
          .from('albums')
          .select('*')
          .eq('user_id', profile.id)
        
        if (albumsData) setAlbums(albumsData)
      } catch (err) {
        console.error('Error fetching user content:', err)
      }
    }
    
    fetchUserContent()
  }, [profile?.id])
  
  // Combine profile with role information
  useEffect(() => {
    if (profile) {
      setUserProfile({
        ...profile,
        role: profile.professional_title || 'Artist', // Use professional_title from profile
        streams: stats?.streams || 0,
        gems: stats?.gems || 0,
      });
    }
  }, [profile, stats]);

  if (loading || !userProfile) {
    return <PageLoading />
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset">
        {/* Profile Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {docItems.map(item => (
              <SidebarMenuItem key={item.url}>
                <a href={item.url} className="flex items-center gap-3 p-2 w-full">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </AppSidebar>
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col min-h-screen bg-background">
          <SiteHeader />
          <ScrollArea className="h-screen">
        <div className="flex flex-col">
          <ProfileHeader
            user={authUser || { id: '' }}
            profile={userProfile}
            stats={stats || {
              user_id: userProfile.id,
              streams: userProfile.streams || 0,
              followers: 0,
              gems: userProfile.gems || 0,
              tracks: tracks.length,
              playlists: playlists.length,
              albums: albums.length
            }}
            updateProfile={updateProfile} // Pass the updateProfile function
            setUploadType={setUploadType} // Pass the setUploadType state setter
            setShowCreateProjectDialog={setShowCreateProjectDialog}
            setShowCreateSoundpackDialog={setShowCreateSoundpackDialog}
          />
          <ProfileInfo
            profile={userProfile}
            isLoading={loading}
          />
          {/* Render UploadDialog here and pass the onUpload prop */}
          <UploadDialog // Always render UploadDialog
            open={uploadType !== null} // Control open state based on uploadType
            onOpenChange={(open) => !open && setUploadType(null)}
            onUpload={handleUploadSuccess} // Pass the new handler
            type={uploadType || undefined} // Pass the upload type
          />
          <div className="container max-w-8xl mx-auto px-4 md:px-6 -mt-6 pb-12">
            <ProfileContent
              user={userProfile}
              stats={stats || {
                user_id: userProfile.id,
                streams: userProfile.streams || 0,
                followers: 0,
                gems: userProfile.gems || 0,
                tracks: tracks.length,
                playlists: playlists.length,
                albums: albums.length
              }}
              tracks={tracks}
              playlists={playlists}
              albums={albums}
              showCreateProjectDialog={showCreateProjectDialog}
              setShowCreateProjectDialog={setShowCreateProjectDialog}
              showCreateSoundpackDialog={showCreateSoundpackDialog}
              setShowCreateSoundpackDialog={setShowCreateSoundpackDialog}
            />
          </div>
        </div>
      </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
