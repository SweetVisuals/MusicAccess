'use client'

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Music,
  FileText,
  FileSignature,
  Download,
  Trash2,
  Eye,
  Play,
  Pause,
  Gem,
  Edit,
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react'
import { useAudioPlayer } from '@/contexts/audio-player-context'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { type Project, type Note, type Contract } from '@/lib/types'
import { formatDuration, formatDateRelative } from '@/lib/utils'

interface SimplifiedStudioProjectCardProps {
  project: Project
  onDelete?: () => void
  onViewDetails?: () => void
  onEdit?: (project: Project) => void
  onAddNote?: (project: Project) => void
  isSelected?: boolean
}

export function SimplifiedStudioProjectCard({
  project,
  onDelete,
  onViewDetails,
  onEdit,
  onAddNote,
  isSelected = false
}: SimplifiedStudioProjectCardProps) {
  const { user } = useAuth()
  const { currentTrack, playTrack, togglePlay, isPlaying } = useAudioPlayer()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAllTracks, setShowAllTracks] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [contractsCount, setContractsCount] = useState(0)
  const [recentNotes, setRecentNotes] = useState<Note[]>([])

  useEffect(() => {
    fetchNotesCount()
    fetchContractsCount()
    fetchRecentNotes()
  }, [project.id])

  const fetchNotesCount = async () => {
    if (!user) return
    
    try {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('project_id', project.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      setNotesCount(count || 0)
    } catch (error) {
      console.error('Error fetching notes count:', error)
    }
  }

  const fetchContractsCount = async () => {
    if (!user) return
    
    try {
      const { count, error } = await supabase
        .from('project_contracts')
        .select('*', { count: 'exact' })
        .eq('project_id', project.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      setContractsCount(count || 0)
    } catch (error) {
      console.error('Error fetching contracts count:', error)
    }
  }

  const fetchRecentNotes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      setRecentNotes(data || [])
    } catch (error) {
      console.error('Error fetching recent notes:', error)
    }
  }

  const handlePlayTrack = (track: any) => {
    if (currentTrack?.id === track.id && isPlaying) {
      togglePlay()
    } else {
      playTrack({
        ...track,
        title: track.title ? track.title.replace(/\.[^/.]+$/, "") : '',
        audioUrl: track.audio_url,
        projectTitle: project.title,
        artworkUrl: project.cover_image_url,
        duration: track.duration || 0,
      })
    }
  }

  const handleDeleteProject = async () => {
    if (!user) {
      toast.error("Please sign in to delete projects")
      return
    }

    try {
      setIsDeleting(true)
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      toast.success("Project deleted successfully")
      
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error("Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadProject = async () => {
    if (!user) {
      toast.error("Please sign in to download projects")
      return
    }

    try {
      // Only allow project owner to download
      if (user.id !== project.user_id) {
        toast.error("Only the project owner can download the project")
        return
      }

      // Fetch all audio tracks for this project
      const { data: audioTracks, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true })

      if (tracksError) throw tracksError

      if (!audioTracks || audioTracks.length === 0) {
        toast.error("No audio tracks found to download")
        return
      }

      toast.loading("Preparing download...")

      // Create a zip file with all audio tracks
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Add each audio track to the zip
      for (const track of audioTracks) {
        if (track.audio_url) {
          try {
            const response = await fetch(track.audio_url)
            const blob = await response.blob()
            const fileName = track.title || `track_${track.id}.mp3`
            zip.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading track ${track.id}:`, error)
          }
        }
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create download link
      const downloadUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(downloadUrl)
      
      toast.success("Project downloaded successfully")
    } catch (error) {
      console.error('Error downloading project:', error)
      toast.error("Failed to download project")
    }
  }

  const handleAddNote = () => {
    if (onAddNote) {
      onAddNote(project)
    }
  }

  const audioTracks = project.audio_tracks || []
  const totalTracks = audioTracks.length
  const visibleTracks = showAllTracks ? audioTracks : audioTracks.slice(0, 3)

  const creator = {
    name: project.profiles?.full_name || project.creator_username || 'Creator',
    username: project.profiles?.username || project.creator_username || '',
    avatar: project.profiles?.avatarUrl || '',
    professional_title: project.profiles?.professional_title || 'User',
  }

  return (
    <div 
      className={`group relative bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 w-full flex flex-col cursor-pointer ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onViewDetails}
    >
      {/* Header with Darker Background */}
      <div className="bg-muted/30 rounded-lg p-3 mb-4 -mx-2 -mt-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link to={`/view/${project.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-base line-clamp-2 leading-tight text-foreground">
                {project.title}
              </h3>
            </Link>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-sm">
              <DropdownMenuItem onClick={() => navigate(`/view/${project.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {user && user.id === project.user_id && (
                <>
                  <DropdownMenuItem onClick={() => onEdit && onEdit(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadProject}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5" />
            <span className="font-medium">{audioTracks.length}</span>
            <span>tracks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-medium">{notesCount}</span>
            <span>notes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileSignature className="h-3.5 w-3.5" />
            <span className="font-medium">{contractsCount}</span>
            <span>contracts</span>
          </div>
        </div>
      </div>

      {/* Tracks Card in Middle */}
      {audioTracks.length > 0 && (
        <div className="bg-muted/10 border border-border/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Music className="h-4 w-4" />
              Tracks
            </h4>
            <span className="text-xs text-muted-foreground">
              {totalTracks} total
            </span>
          </div>
          
          <div className="space-y-2">
            {visibleTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted/20 transition-colors group/track"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayTrack(track)
                }}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-primary/10 rounded-full group-hover/track:bg-primary/20 transition-colors">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-3 w-3 text-primary" />
                  ) : (
                    <Play className="h-3 w-3 text-primary" />
                  )}
                </div>
                <span className="truncate font-medium flex-1">
                  {track.title ? track.title.replace(/\.[^/.]+$/, "") : 'Untitled'}
                </span>
                {track.duration && (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {totalTracks > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAllTracks(!showAllTracks)
              }}
              className="text-xs text-muted-foreground hover:text-foreground mt-2 font-medium w-full text-center"
            >
              {showAllTracks ? 'Show less' : `+${totalTracks - 3} more tracks`}
            </button>
          )}
        </div>
      )}

      {/* Notes and Contracts as Small Details */}
      <div className="space-y-2 mb-4">
        {/* Recent Note Preview */}
        {recentNotes.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground line-clamp-1">
                {recentNotes[0].title}
              </p>
              {recentNotes[0].content && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {recentNotes[0].content.replace(/<[^>]*>/g, '')}
                </p>
              )}
            </div>
            {notesCount > 1 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{notesCount - 1}
              </Badge>
            )}
          </div>
        )}

        {/* Contracts Indicator */}
        {contractsCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-green-50/50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30">
            <FileSignature className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-xs font-medium text-foreground">
              {contractsCount} contract{contractsCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Footer with Creator Info */}
      <div className="mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Link 
            to={`/user/${creator.username}`} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-6 w-6">
              {creator.avatar ? (
                <AvatarImage src={creator.avatar} alt={creator.name} />
              ) : (
                <AvatarFallback className="text-xs bg-primary/10">
                  {creator.name ? creator.name[0] : 'C'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {creator.name}
              </p>
              {creator.professional_title && (
                <p className="text-xs text-muted-foreground truncate">
                  {creator.professional_title}
                </p>
              )}
            </div>
          </Link>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDateRelative(project.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}
