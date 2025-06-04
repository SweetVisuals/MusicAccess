import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { UnifiedFileBrowser } from "@/components/upload/upload-with-browser"

export default function ProjectsPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in">
            <UnifiedFileBrowser initialFiles={[]} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}