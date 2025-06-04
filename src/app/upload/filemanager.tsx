import { AppSidebar } from "@/components/dashboard/layout/app-sidebar.tsx";
import { SiteHeader } from "@/components/dashboard/layout/site-header.tsx";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
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

            {/* Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Drag and drop your audio files</h3>
              <p className="text-muted-foreground mb-4">
                Or click the upload button above to browse
              </p>
              <div className="max-w-sm mx-auto text-sm text-muted-foreground">
                <p>Supported formats: MP3, WAV, AAC, FLAC, OGG, M4A</p>
                <p>Maximum file size: 500MB</p>
              </div>
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