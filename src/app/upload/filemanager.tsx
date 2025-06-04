import { AppSidebar } from "@/components/dashboard/layout/app-sidebar.tsx";
import { SiteHeader } from "@/components/dashboard/layout/site-header.tsx";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import FileManager from './upload.tsx';

export default function UploadPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-6">
            <FileManager />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
