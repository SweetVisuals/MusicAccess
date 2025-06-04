import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { Upload, Folder, File } from "lucide-react"
import rawFileData from "./files.json"
import { UnifiedFileBrowser } from "@/components/upload/upload-with-browser"

const fileData = rawFileData as FileItem[]

interface FileItem {
  name: string
  type: 'file' | 'folder'
  size?: string
  modified?: string
  children?: FileItem[]
  id: string
}


export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex justify-between items-center px-4 lg:px-6">
                  <h2 className="text-xl font-semibold">Files</h2>
                  <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                </div>
                
                <div className="px-4 lg:px-6 h-[calc(100vh-180px)]">
                  <UnifiedFileBrowser 
                    initialFiles={fileData.map(file => ({
                      id: file.id,
                      name: file.name,
                      type: file.type,
                      size: file.size || '',
                      modified: file.modified || '',
                      icon: file.type === 'folder' ? 
                        <Folder className="h-4 w-4 text-blue-500" /> : 
                        <File className="h-4 w-4 text-gray-500" />
                    }))}
                  />
                </div>
              </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
