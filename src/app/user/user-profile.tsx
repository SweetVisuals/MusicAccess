import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfo from "@/components/profile/ProfileInfo"
import ProfileContent from "@/components/profile/ProfileContent"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SiteHeader } from "@/components/homepage/site-header"
import { ScrollArea } from "@/components/@/ui/scroll-area"
import { NavDocuments } from "@/components/homepage/nav-documents"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"

import { Settings, User, Home, Library, Mic2, Disc3, Compass, Music2, Users } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

const docItems = [
  { name: 'Profile Settings', url: '/profile/settings', icon: Settings },
  { name: 'Account', url: '/profile/account', icon: User }
];

type UserProfile = {
  name: string;
  username: string;
  role: string;
  bio: string;
  streams: number;
  gems: number;
  banner: string;
  avatar: string;
};

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    setTimeout(() => {
      setProfile({
        name: "Alex Johnson",
        username: "alexjohnson",
        role: "Vocalist",
        bio: "Professional vocalist with 10+ years experience. Specializing in jazz and R&B.",
        streams: 12540,
        gems: 42,
        banner: "/banner.jpg",
        avatar: "/avatar.jpg"
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading || !profile) {
    return <PageLoading />
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset">
        <NavDocuments items={docItems} />
      </AppSidebar>
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col">
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <ScrollArea className="h-screen">
        <div className="flex flex-col">
          <ProfileHeader />
          <ProfileInfo />
          <div className="container max-w-6xl mx-auto px-4 md:px-6 -mt-6 pb-12">
            <ProfileContent />
          </div>
        </div>
      </ScrollArea>
    </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
