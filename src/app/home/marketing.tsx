import { BarChartIcon } from "lucide-react"
import { AppSidebar } from "@/components/homepage/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { SiteHeader } from "@/components/homepage/site-header"

export default function MarketingPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="@container/main flex flex-1 flex-col">
          <SiteHeader />
          <div className="flex-1 flex flex-col gap-8 py-4 md:gap-10 md:py-6 px-4">
            <section className="space-y-4">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChartIcon className="h-8 w-8" />
                Marketing
              </h1>
              <p className="text-muted-foreground">
                Tools and resources to promote your music
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">
                Our marketing resources are currently under development.
              </p>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
