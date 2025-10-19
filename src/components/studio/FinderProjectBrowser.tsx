'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { type Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Grid,
  List,
  Folder,
  FolderOpen,
  Home,
  ChevronRight,
  Plus,
  Filter,
  Calendar,
  MoreHorizontal,
  FileText,
  FileSignature,
  Music,
  Package,
  Settings,
  ShoppingBag,
  Download
} from 'lucide-react'
import { DraggableProject } from '@/components/studio/DraggableProject'
import { ProjectOverviewCard } from '@/components/studio/ProjectOverviewCard'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface FinderProjectBrowserProps {
  projects: Project[]
  soundpacks: Project[]
  services: any[]
  files: any[]
  purchasedFiles?: any[]
  onProjectCreated: () => void
  onProjectDeleted: () => void
  onProjectEdited: (project: Project) => void
  onProjectSelected?: (project: Project | null) => void
  onCreateProject: () => void
  selectedProject: Project | null // Add selectedProject to props
}

export function FinderProjectBrowser({
  projects,
  soundpacks,
  services,
  files,
  purchasedFiles = [],
  onProjectCreated,
  onProjectDeleted,
  onProjectEdited,
  onProjectSelected,
  onCreateProject,
  selectedProject // Destructure selectedProject from props
}: FinderProjectBrowserProps) {
  const { user } = useAuth()
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'projects' | 'soundpacks' | 'services' | 'files' | 'purchased'>('projects')
  // const [selectedProject, setSelectedProject] = useState<Project | null>(null) // Remove internal state
  const [sortBy, setSortBy] = useState<string>('newest')
  // const [filterStatus, setFilterStatus] = useState<string>('all')
  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Studio', path: '/dashboard/studio' }
  ])
  const [projectOrder, setProjectOrder] = useState<Project[]>([])

  // Initialize project order
  useEffect(() => {
    setProjectOrder(filteredProjects)
  }, [filteredProjects])

  // Filter and sort projects
  useEffect(() => {
    let filtered = projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'popular':
          return (b.totalTracks || 0) - (a.totalTracks || 0)
        default:
          return 0
      }
    })

    setFilteredProjects(filtered)
  }, [projects, searchTerm, sortBy])

  const handleProjectSelect = useCallback((project: Project | null | undefined) => {
    if (project === null || project === undefined) {
      // Unselect project
      // setSelectedProject(null) // Remove internal state update
      setBreadcrumbs([{ label: 'Studio', path: '/dashboard/studio' }])
      onProjectSelected?.(null)
    } else {
      // Select project
      // setSelectedProject(project) // Remove internal state update
      setBreadcrumbs([
        { label: 'Studio', path: '/dashboard/studio' },
        { label: project.title, path: `/dashboard/studio/project/${project.id}` }
      ])
      onProjectSelected?.(project)
    }
  }, [onProjectSelected])

  const handleBackToStudio = useCallback(() => {
    // setSelectedProject(null) // Remove internal state update
    setBreadcrumbs([{ label: 'Studio', path: '/dashboard/studio' }])
    onProjectSelected?.(null) // Notify parent to unselect
  }, [onProjectSelected])

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'projects': return filteredProjects
      case 'soundpacks': return soundpacks
      case 'services': return services
      case 'files': return files
      case 'purchased': return purchasedFiles
      default: return filteredProjects
    }
  }

  const getTabIcon = () => {
    switch (activeTab) {
      case 'projects': return <Music className="h-4 w-4" />
      case 'soundpacks': return <Package className="h-4 w-4" />
      case 'services': return <Settings className="h-4 w-4" />
      case 'files': return <Folder className="h-4 w-4" />
      case 'purchased': return <ShoppingBag className="h-4 w-4" />
      default: return <Folder className="h-4 w-4" />
    }
  }

  const getTabCount = () => {
    switch (activeTab) {
      case 'projects': return filteredProjects.length
      case 'soundpacks': return soundpacks.length
      case 'services': return services.length
      case 'files': return files.length
      case 'purchased': return purchasedFiles.length
      default: return 0
    }
  }


  // Handle moving projects for drag and drop
  const handleMoveProject = useCallback((fromIndex: number, toIndex: number) => {
    setProjectOrder(prevOrder => {
      const newOrder = [...prevOrder]
      const [movedItem] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, movedItem)
      return newOrder
    })
  }, [])

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast.error(`Error downloading file: ${error.message}`)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col h-full bg-background">
      {/* Breadcrumb Navigation - Mac Finder Style */}
      <div className="flex items-center gap-1 px-6 py-4 border-b bg-muted/20">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1">
            {index === 0 ? (
              <Home className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
            )}
            <button
              onClick={index === breadcrumbs.length - 1 ? undefined : handleBackToStudio}
              className={`text-sm px-2 py-1 rounded hover:bg-accent transition-colors ${
                index === breadcrumbs.length - 1 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar - Mac Finder Style */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7"
            >
              <Grid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-7 w-7"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8 w-64 text-sm"
            />
          </div>

          {/* Filter Dropdown - Removed since Project type doesn't have status property */}

          {/* Sort Dropdown */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-background h-8"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Sort
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 px-6 py-3 border-b">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'projects'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Music className="h-4 w-4" />
          Projects
          <Badge variant="secondary" className="ml-1 h-6 min-w-6 px-1.5 text-xs flex items-center justify-center">
            {projects.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('soundpacks')}
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'soundpacks'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Package className="h-4 w-4" />
          Soundpacks
          <Badge variant="secondary" className="ml-1 h-6 min-w-6 px-1.5 text-xs flex items-center justify-center">
            {soundpacks.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Settings className="h-4 w-4" />
          Services
          <Badge variant="secondary" className="ml-1 h-6 min-w-6 px-1.5 text-xs flex items-center justify-center">
            {services.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Folder className="h-4 w-4" />
          Files
          <Badge variant="secondary" className="ml-1 h-6 min-w-6 px-1.5 text-xs flex items-center justify-center">
            {files.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('purchased')}
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'purchased'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Purchased
          <Badge variant="secondary" className="ml-1 h-6 min-w-6 px-1.5 text-xs flex items-center justify-center">
            {purchasedFiles.length}
          </Badge>
        </button>
      </div>

      {/* Main Content Area - Full height and width */}
      <div className="flex-1 flex h-full min-h-0 w-full">
        {/* Projects Grid/List - Always full width */}
        <div className="w-full p-6 overflow-y-auto">
          {/* Header with current tab info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {getTabIcon()}
              <h2 className="text-lg font-semibold capitalize">
                {activeTab} ({getTabCount()})
              </h2>
            </div>
            {activeTab === 'projects' && (
              <Button size="sm" className="gap-2" onClick={onCreateProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>

          {/* Items Grid/List */}
          {getCurrentItems().length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="flex flex-col items-center justify-center">
                {activeTab === 'projects' && <Music className="h-12 w-12 text-muted-foreground mb-4" />}
                {activeTab === 'soundpacks' && <Package className="h-12 w-12 text-muted-foreground mb-4" />}
                {activeTab === 'services' && <Settings className="h-12 w-12 text-muted-foreground mb-4" />}
                {activeTab === 'files' && <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />}
                {activeTab === 'purchased' && <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />}
                
                <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' :
                   activeTab === 'purchased' ? 'Purchase files from the marketplace to see them here' :
                   `Get started by creating your first ${activeTab.slice(0, -1)}`}
                </p>
                {activeTab === 'projects' && (
                  <Button size="sm" onClick={onCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create {activeTab.slice(0, -1)}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              : "space-y-2"
            }>
              {activeTab === 'projects' ? (
                projectOrder.map((item, index) => (
                  <DraggableProject
                    key={item.id}
                    project={item}
                    index={index}
                    onMoveProject={handleMoveProject}
                    onDelete={onProjectDeleted}
                    onViewDetails={(project) => handleProjectSelect(project)}
                    onEdit={onProjectEdited}
                    isSelected={selectedProject?.id === item.id}
                    variant={viewMode}
                  />
                ))
              ) : activeTab === 'files' ? (
                // Render individual files with enhanced card design
                files.map((file, index) => (
                  <div
                    key={`${file.id}-${index}`}
                    className="group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200 hover:-translate-y-1"
                  >
                    {/* File Type Icon */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        {file.file_type === 'audio' ? (
                          <Music className="w-6 h-6 text-primary" />
                        ) : file.file_type === 'image' ? (
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                        ) : file.file_type === 'video' ? (
                          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                        ) : file.file_type === 'document' ? (
                          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-yellow-500 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <Folder className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file.file_url, file.name)}
                            className="h-8 w-8 hover:bg-primary/10"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Add to Project Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation() // Prevent card click from unselecting project
                            if (!selectedProject) {
                              toast.error('Please select a project first')
                              return
                            }

                            if (!user) {
                              toast.error('Please sign in to add files to projects')
                              return
                            }

                            try {
                              // Check if file is already attached
                              const { data: existingFiles, error: checkError } = await supabase
                                .from('project_files')
                                .select('id')
                                .eq('project_id', selectedProject.id)
                                .eq('file_id', file.id)

                              if (checkError) throw checkError

                              if (existingFiles && existingFiles.length > 0) {
                                toast.info('File is already attached to this project')
                                return
                              }

                              // Attach file to project
                              const { error: attachError } = await supabase
                                .from('project_files')
                                .insert({
                                  project_id: selectedProject.id,
                                  file_id: file.id,
                                  file_name: file.name,
                                  file_url: file.file_path || '',
                                  file_type: file.file_type || 'unknown',
                                  file_size: file.size || 0,
                                  file_extension: file.name?.split('.').pop() || '',
                                  user_id: user.id
                                })

                              if (attachError) throw attachError

                              toast.success(`Added "${file.name}" to ${selectedProject.title}`)
                            } catch (error) {
                              console.error('Error attaching file:', error)
                              toast.error('Failed to add file to project')
                            }
                          }}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Add to selected project"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded-full text-xs">
                          {file.file_type?.toUpperCase() || 'FILE'}
                        </span>
                        <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Modified: {new Date(file.updated_at || file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Hover Background */}
                    <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))
              ) : activeTab === 'purchased' ? (
                // Render purchased files with enhanced card design
                purchasedFiles.map((file, index) => (
                  <div
                    key={`${file.id}-${index}`}
                    className="group relative bg-card border rounded-xl p-4 hover:shadow-lg hover:border-green-500/50 transition-all duration-200 hover:-translate-y-1"
                  >
                    {/* Purchased File Icon */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file.url, file.name)}
                            className="h-8 w-8 hover:bg-green-500/10"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-green-600 transition-colors">
                        {file.name}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            PURCHASED
                          </span>
                          <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}</span>
                        </div>
                        {file.item_title && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            From: {file.item_title}
                          </p>
                        )}
                        {file.order_date && (
                          <p className="text-xs text-muted-foreground">
                            Purchased: {new Date(file.order_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hover Background */}
                    <div className="absolute inset-0 bg-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))
              ) : (
                getCurrentItems().map((item) => (
                  <ProjectOverviewCard
                    key={item.id}
                    project={item}
                    onDelete={onProjectDeleted}
                    onViewDetails={(project) => handleProjectSelect(project)}
                    onEdit={onProjectEdited}
                    isSelected={selectedProject?.id === item.id} // Use the prop for comparison
                    variant={viewMode}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </DndProvider>
  )
}
