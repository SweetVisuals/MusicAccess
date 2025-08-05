import { FileManager } from "@/components/upload/file-manager"

export default function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in">
        <FileManager />
      </div>
    </div>
  )
}
