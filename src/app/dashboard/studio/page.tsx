'use client'

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, FileText, FileSignature, ShoppingBag, Music, Package } from 'lucide-react'
import { FinderProjectBrowser } from '@/components/studio/FinderProjectBrowser'
import StudioProjectDialog from '@/components/studio/StudioProjectDialog'
import ProjectEditor from '@/components/studio/ProjectEditor'
import { FinderNotesPanel } from '@/components/studio/FinderNotesPanel'
import { FinderContractsPanel } from '@/components/studio/FinderContractsPanel'
import { StudioFilesPanel } from '@/components/studio/StudioFilesPanel'
import { type Project, type Note, type Contract } from '@/lib/types'

export default function StudioPage() {
   const { user } = useAuth()
   const location = useLocation()
   const [projects, setProjects] = useState<Project[]>([])
   const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
   const [soundpacks, setSoundpacks] = useState<Project[]>([])
   const [services, setServices] = useState<any[]>([])
   const [files, setFiles] = useState<any[]>([])
   const [purchasedFiles, setPurchasedFiles] = useState<any[]>([])
   const [isLoading, setIsLoading] = useState(true)
   const [showCreateDialog, setShowCreateDialog] = useState(false)
   const [editingProject, setEditingProject] = useState<Project | null>(null)
   const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
   const [selectedProject, setSelectedProject] = useState<Project | null>(null)
   const [activePanel, setActivePanel] = useState<'notes' | 'contracts' | 'files'>('notes')
   const [breadcrumbs, setBreadcrumbs] = useState([
     { label: 'Dashboard', path: '/dashboard' },
     { label: 'Studio', path: '/dashboard/studio' }
   ])

  useEffect(() => {
    if (user) {
      fetchUserProjects()
      fetchUserSoundpacks()
      fetchUserServices()
      fetchUserFiles()
      fetchPurchasedFiles()
    }
  }, [user])

  useEffect(() => {
    // Just set filtered projects to all projects initially
    // The FinderProjectBrowser will handle its own filtering
    setFilteredProjects(projects)
  }, [projects])

  // Handle location state for showing create dialog
  useEffect(() => {
    if (location.state?.showCreateDialog) {
      setShowCreateDialog(true)
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const fetchUserProjects = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Fetch all user projects and filter for studio projects in JavaScript
      const { data: allProjects, error: allError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!fk_profiles (
            username,
            full_name,
            avatar_url,
            professional_title
          ),
          audio_tracks (
            id,
            title,
            audio_url,
            duration,
            price,
            allow_download
          ),
          project_contracts (
            contracts (
              id,
              title,
              type,
              status,
              created_at
            )
          ),
          gems,
          streams
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Filter for studio projects in JavaScript
      const projectsData = allProjects ? allProjects.filter(project =>
        project.tags && (
          project.tags.includes('studio') ||
          (Array.isArray(project.tags) && project.tags.some((tag: string) => tag === 'studio'))
        )
      ) : []

      if (allError) throw allError

      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load your projects')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserSoundpacks = async () => {
    if (!user) return

    try {
      const { data: soundpacksData, error: soundpacksError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!fk_profiles (
            username,
            full_name,
            avatar_url,
            professional_title
          ),
          audio_tracks (
            id,
            title,
            audio_url,
            duration,
            price,
            allow_download
          )
        `)
        .eq('user_id', user.id)
        .or('type.eq.soundpack,tags.cs.{soundpack}')
        .order('created_at', { ascending: false })

      if (soundpacksError) throw soundpacksError

      setSoundpacks(soundpacksData || [])
    } catch (error) {
      console.error('Error fetching soundpacks:', error)
      toast.error('Failed to load your soundpacks')
    }
  }

  const fetchUserServices = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to load your services')
    }
  }

  const fetchUserFiles = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load your files')
    }
  }

  const fetchPurchasedFiles = async () => {
    if (!user) return

    try {
      // Fetch user's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          items,
          order_date,
          status
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('order_date', { ascending: false })

      if (ordersError) throw ordersError

      // Extract purchased files from orders with deduplication
      const fileMap = new Map<string, any>()
      
      if (orders) {
        for (const order of orders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              if (item.files && Array.isArray(item.files)) {
                for (const file of item.files) {
                  // Use file ID as key, or create a composite key if no ID
                  const fileKey = file.id || `${file.name}-${file.url}`
                  if (!fileMap.has(fileKey)) {
                    fileMap.set(fileKey, {
                      ...file,
                      order_id: order.id,
                      order_date: order.order_date,
                      item_title: item.title
                    })
                  }
                }
              }
            }
          }
        }
      }

      setPurchasedFiles(Array.from(fileMap.values()))
    } catch (error) {
      console.error('Error fetching purchased files:', error)
      toast.error('Failed to load purchased files')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user?.id)

      if (error) throw error

      toast.success('Project deleted successfully')
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setSoundpacks(prev => prev.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project)
    setShowCreateDialog(true)
  }

  const handleCloseEditor = () => {
    setEditingProject(null)
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Studio', path: '/dashboard/studio' }
    ])
  }

  const handleProjectUpdated = () => {
    fetchUserProjects()
    fetchUserSoundpacks()
    setEditingProject(null)
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Studio', path: '/dashboard/studio' }
    ])
  }

  const handleProjectDeleted = () => {
    fetchUserProjects()
    fetchUserSoundpacks()
    setEditingProject(null)
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Studio', path: '/dashboard/studio' }
    ])
  }

  const handleProjectSelected = (project: Project | null) => {
    setSelectedProject(project)
  }


  const handleNoteCreated = () => {
    fetchUserProjects() // Refresh to get updated notes count
  }

  const handleNoteUpdated = () => {
    fetchUserProjects() // Refresh to get updated notes count
  }

  const handleNoteDeleted = () => {
    fetchUserProjects() // Refresh to get updated notes count
  }

  const handleContractAttached = () => {
    fetchUserProjects() // Refresh to get updated contracts
  }

  const handleContractRemoved = () => {
    fetchUserProjects() // Refresh to get updated contracts
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">My Studio</h1>
            <p className="text-muted-foreground">
              Manage your projects, notes, contracts, and purchased files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Project Browser */}
          <div className="w-2/3 border-r">
            <FinderProjectBrowser
              projects={filteredProjects}
              soundpacks={soundpacks}
              services={services}
              files={files}
              purchasedFiles={purchasedFiles}
              onProjectCreated={fetchUserProjects}
              onProjectDeleted={fetchUserProjects}
              onProjectEdited={handleEditProject}
              onProjectSelected={handleProjectSelected}
              onCreateProject={() => setShowCreateDialog(true)}
              selectedProject={selectedProject}
            />
          </div>

          {/* Right Panel - Details */}
          <div className="w-1/3 flex flex-col min-h-0">
            {selectedProject ? (
              <>
                {/* Project Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      {selectedProject.cover_image_url ? (
                        <img
                          src={selectedProject.cover_image_url}
                          alt={selectedProject.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {selectedProject.title}
                      </h3>
                      {selectedProject.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel Tabs */}
                <div className="border-b">
                  <div className="flex">
                    <button
                      onClick={() => setActivePanel('notes')}
                      className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activePanel === 'notes'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </div>
                    </button>
                    <button
                      onClick={() => setActivePanel('contracts')}
                      className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activePanel === 'contracts'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        Contracts
                      </div>
                    </button>
                    <button
                      onClick={() => setActivePanel('files')}
                      className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activePanel === 'files'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Files
                      </div>
                    </button>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  {activePanel === 'notes' && (
                    <FinderNotesPanel
                      project={selectedProject}
                      onNoteCreated={handleNoteCreated}
                      onNoteUpdated={handleNoteUpdated}
                      onNoteDeleted={handleNoteDeleted}
                    />
                  )}
                  {activePanel === 'contracts' && (
                    <FinderContractsPanel
                      project={selectedProject}
                      onContractAttached={handleContractAttached}
                      onContractRemoved={handleContractRemoved}
                    />
                  )}
                  {activePanel === 'files' && (
                    <StudioFilesPanel
                      project={selectedProject}
                      purchasedFiles={purchasedFiles}
                      onFilesUpdated={() => {
                        fetchUserFiles()
                        fetchPurchasedFiles()
                        fetchUserProjects() // Refresh projects to update file counts
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a project from the left panel to view and manage its details, notes, contracts, and files.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Project
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Studio Project Dialog */}
        <StudioProjectDialog
          isOpen={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false)
            setProjectToEdit(null)
          }}
          onProjectSaved={() => {
            fetchUserProjects()
            setProjectToEdit(null)
          }}
          projectToEdit={projectToEdit}
          purchasedFiles={purchasedFiles}
        />

        {/* Project Editor */}
        {editingProject && (
          <ProjectEditor
            project={editingProject}
            onClose={handleCloseEditor}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
