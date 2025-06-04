import { AppSidebar } from "@/components/dashboard/layout/app-sidebar.tsx";
import { SiteHeader } from "@/components/dashboard/layout/site-header.tsx";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { UnifiedFileBrowser } from '@/components/upload/upload-with-browser';
import { Button } from "@/components/@/ui/button";
import { Upload } from "lucide-react";
import { UploadDialog } from "@/components/profile/UploadDialog";
import { useState } from "react";

export default function UploadPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="p-8 space-y-8">
            {/* Upload Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Upload Audio</h1>
                <p className="text-muted-foreground">Upload and manage your audio files</p>
              </div>
              <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            </div>

            {/* File Browser */}
            <div className="border rounded-lg">
              <UnifiedFileBrowser initialFiles={[]} />
            </div>
          </div>

          {/* Upload Dialog */}
          <UploadDialog 
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            onUpload={async (files) => {
              console.log('Files to upload:', files);
              // Here you would handle the actual file upload
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}