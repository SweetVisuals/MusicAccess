import { useAuth } from "@/contexts/auth-context"
import { Dock } from "@/components/@/ui/dock-two"
import { SiteHeader } from "@/components/homepage/site-header"
import { FeaturesSectionWithHoverEffects } from "@/components/blocks/feature-section-with-hover-effects"
import { AudioPlayerCard } from "@/components/homepage/audio-player-card"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { NavMain } from "@/components/homepage/nav-main"
import { NavSecondary } from "@/components/homepage/nav-secondary"
import { NavUser } from "@/components/homepage/nav-user"
import { NavDocuments } from "@/components/homepage/nav-documents"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Home, Settings, Music, Mic2, Disc3 } from "lucide-react"
import { AudioPlayer } from "@/components/audio/audio-player"

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Find Talent', url: '/find-talent', icon: Music },
  { title: 'Library', url: '/library', icon: Music },
  { title: 'Record', url: '/record', icon: Mic2 },
  { title: 'Projects', url: '/projects', icon: Disc3 }
];

const docItems = [
  { name: 'Getting Started', url: '/discover/start', icon: Home },
  { name: 'API Reference', url: '/discover/api', icon: Settings }
];

const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatar.png'
};

export default function HomePage() {
  const { user } = useAuth()
  return (
    <SidebarProvider>
      <AppSidebar variant="inset">
        <NavMain items={navItems} />
        <NavDocuments items={docItems} />
      </AppSidebar>
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col">
          <SiteHeader />
          <div className="sticky top-0 z-40 bg-background">
          </div>
          <div className="absolute right-4 top-4 z-50">
          </div>

          <div className="flex-1 flex flex-col gap-8 py-4 md:gap-10 md:py-6 px-4">
            <section className="space-y-4">
              
            </section>

            <section className="space-y-4">
              <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
              
              </div>
            </section>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
