'use client'

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Download,
  Trash2,
  Eye,
  Play,
  Pause,
  Gem,
  Edit,
  MessageSquare,
  Clock,
  TrendingUp,
  FileSignature,
  Package,
  Plus,
  Check
} from 'lucide-react'
import { useAudioPlayer } from '@/contexts/audio-player-context'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { type Project } from '@/lib/types'
import { formatDuration, formatDateRelative } from '@/lib/utils'
import StudioProjectEditDialog from './StudioProjectEditDialog'

interface ProjectOverviewCardProps {
  project: Project
  onDelete?: () => void
  onViewDetails?: (project?: Project | null) => void
  onEdit?: (project: Project) => void
  isSelected?: boolean
  variant?: 'grid' | 'list'
  showContractsAsAttachments?: boolean
}

export function ProjectOverviewCard({
  project,
  onDelete,
  onViewDetails,
  onEdit,
  isSelected = false,
  variant = 'grid'
}: ProjectOverviewCardProps) {
  const { user } = useAuth()
  const { currentTrack, playTrack, togglePlay, isPlaying } = useAudioPlayer()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAllTracks, setShowAllTracks] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [contracts, setContracts] = useState<any[]>([])
  const [projectFiles, setProjectFiles] = useState<any[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showFileSelector, setShowFileSelector] = useState(false)
  const [availableFiles, setAvailableFiles] = useState<any[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])

  useEffect(() => {
    fetchNotesCount()
    fetchContracts()
    fetchProjectFiles()
  }, [project.id])

  useEffect(() => {
    if (showFileSelector && user) {
      fetchAvailableFiles()
    }
  }, [showFileSelector, user])


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

  const fetchContracts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('project_contracts')
        .select(`
          id,
          contracts (
            id,
            title,
            status,
            created_at
          )
        `)
        .eq('project_id', project.id)
        .eq('user_id', user.id)

      if (error) throw error
      setContracts(data?.map(pc => pc.contracts).filter(Boolean) || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const fetchProjectFiles = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id)

      if (error) throw error
      setProjectFiles(data || [])
    } catch (error) {
      console.error('Error fetching project files:', error)
    }
  }

  const fetchAvailableFiles = async () => {
    if (!user) return

    try {
      // Fetch user's files from the files table
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter out files already attached to this project
      const attachedFileIds = projectFiles.map(pf => pf.file_id)
      const available = (data || []).filter(file => !attachedFileIds.includes(file.id))

      setAvailableFiles(available)
    } catch (error) {
      console.error('Error fetching available files:', error)
    }
  }

  const handleAttachFiles = async () => {
    if (!user || selectedFileIds.length === 0) return

    try {
      const filesToAttach = selectedFileIds.map(fileId => {
        const file = availableFiles.find(f => f.id === fileId)
        return {
          project_id: project.id,
          file_id: fileId,
          file_name: file?.name || 'Unknown',
          file_url: file?.file_path || '',
          file_type: file?.file_type || 'unknown',
          file_size: file?.size || 0,
          file_extension: file?.name?.split('.').pop() || '',
          user_id: user.id
        }
      })

      const { error } = await supabase
        .from('project_files')
        .insert(filesToAttach)

      if (error) throw error

      toast.success(`Attached ${selectedFileIds.length} file${selectedFileIds.length !== 1 ? 's' : ''} to project`)
      setSelectedFileIds([])
      setShowFileSelector(false)
      fetchProjectFiles()
    } catch (error) {
      console.error('Error attaching files:', error)
      toast.error('Failed to attach files')
    }
  }

  const handleFileToggle = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const creator = {
    name: project.profiles?.full_name || project.creator_username || 'Creator',
    username: project.profiles?.username || project.creator_username || '',
    avatar: project.profiles?.avatarUrl || '',
    professional_title: project.profiles?.professional_title || 'User',
  }

  const handlePlayTrack = (group: any) => {
    if (group.bestTrack) {
      // Ensure we're playing the MP3 version if available
      const trackToPlay = group.mp3Track || group.bestTrack;
      const trackFileName = (trackToPlay as any).file_name || trackToPlay.title || '';
      const trackAudioUrl = trackToPlay.audio_url || '';
      const trackInput = trackFileName.includes('.') ? trackFileName : trackAudioUrl;
      const fileType = getFileType(trackInput);

      if (currentTrack?.id === trackToPlay.id && isPlaying) {
        togglePlay()
      } else {
        // Check if the file type is supported by the browser
        if (fileType !== 'mp3' && fileType !== 'wav') {
          const supportedFormats = ['MP3', 'WAV'];
          toast.error(`This track is in ${fileType.toUpperCase()} format. Only ${supportedFormats.join(', ')} formats are supported by your browser. Please ensure MP3 or WAV files are available.`);
          return;
        }

        playTrack({
          id: trackToPlay.id,
          title: group.title, // Use track group title
          audio_url: trackToPlay.audio_url,
          audioUrl: trackToPlay.audio_url, // Add both audioUrl and audio_url for compatibility
          file_url: trackToPlay.audio_url, // Fallback field
          project_id: trackToPlay.project_id,
          user_id: trackToPlay.user_id,
          allow_download: trackToPlay.allow_download,
          price: trackToPlay.price,
          duration: trackToPlay.duration_seconds || trackToPlay.duration || 0,
          created_at: trackToPlay.created_at,
          updated_at: trackToPlay.updated_at,
          projectTitle: project.title,
          artworkUrl: project.cover_image_url,
        });
        // Scroll to bottom to ensure player is visible
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }

  const handleCardClick = () => {
    if (onViewDetails) {
      if (isSelected) {
        onViewDetails(null)
      } else {
        onViewDetails(project)
      }
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
      if (user.id !== project.user_id) {
        toast.error("Only the project owner can download the project")
        return
      }

      const { data: audioTracks, error: tracksError } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('project_id', project.id)
        .order('id', { ascending: true })

      if (tracksError) throw tracksError

      if (!audioTracks || audioTracks.length === 0) {
        toast.error("No audio tracks found to download")
        return
      }

      toast.loading("Preparing download...")

      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

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

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const downloadUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(downloadUrl)
      toast.success("Project downloaded successfully")
    } catch (error) {
      console.error('Error downloading project:', error)
      toast.error("Failed to download project")
    }
  }

  // Helper function to get file type - using the same logic as file browser/upload wizard
  const getFileType = (input: string): string => {
    // If input is empty, return 'other'
    if (!input) {
      return 'other';
    }

    // First try to extract extension from the input (could be filename or URL)
    let extension = '';
    if (input.includes('.')) {
      // Handle URLs by getting the last part after the last slash
      const urlParts = input.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      extension = lastPart.split('.').pop()?.toLowerCase() || '';
    }

    // If no extension found, try common audio file patterns
    if (!extension) {
      // Common audio file extensions that might be in the URL
      const audioExtensions = ['mp3', 'wav', 'wave', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff'];
      for (const ext of audioExtensions) {
        if (input.toLowerCase().includes('.' + ext)) {
          extension = ext;
          break;
        }
      }
    }

    // Map extensions to file types (same logic as upload wizard)
    const formatMap: { [key: string]: string } = {
      'mp3': 'mp3', 'wav': 'wav', 'wave': 'wav', 'flac': 'other', 'aac': 'other', 'ogg': 'other',
      'wma': 'other', 'm4a': 'other', 'aiff': 'other', 'au': 'other', 'ra': 'other',
      'mp4': 'other', 'avi': 'other', 'mov': 'other', 'wmv': 'other', 'flv': 'other',
      'webm': 'other', 'mkv': 'other', 'jpg': 'other', 'jpeg': 'other', 'png': 'other',
      'gif': 'other', 'bmp': 'other', 'tiff': 'other', 'webp': 'other', 'svg': 'other',
      'pdf': 'other', 'doc': 'other', 'docx': 'other', 'txt': 'other', 'rtf': 'other',
      'odt': 'other', 'zip': 'stems', 'rar': 'stems', '7z': 'stems', 'tar': 'other', 'gz': 'other'
    };

    return formatMap[extension] || 'other';
  };

  const audioTracks = useMemo(() => {
    // Extract tracks from project_files - this ensures all audio files are shown
    if (project.project_files && project.project_files.length > 0) {
      return project.project_files
        .filter(pf => {
          const fileType = getFileType(pf.files.file_path || pf.files.name || pf.files.file_url || '');
          return fileType === 'mp3' || fileType === 'wav' || fileType === 'stems';
        }) // Only include audio files
        .map(pf => {
          const fileUrl = pf.files.audio_url || pf.files.file_url || '';
          const correspondingTrack = (project.audio_tracks || []).find(track => track.audio_url === fileUrl);

          return {
            id: correspondingTrack?.id || pf.id,
            // Prioritize the title from audio_tracks (which contains the group name if set)
            title: correspondingTrack?.title || pf.files.name || pf.files.title || `Track ${pf.id}`,
            audio_url: fileUrl,
            allow_download: pf.allow_downloads || false,
            price: pf.price || undefined,
            duration: correspondingTrack?.duration || pf.files.duration || 0,
            project_id: project.id,
            user_id: project.user_id,
            created_at: pf.created_at,
            updated_at: pf.updated_at,
            // Add file type information for filtering
            file_type: pf.files.file_type || getFileType(pf.files.file_path || pf.files.name || pf.files.file_url || ''),
            file_name: pf.files.name || pf.files.file_url || '',
            correspondingTrackId: correspondingTrack?.id
          };
        });
    }

    // Fallback to audio_tracks if no project_files
    if (project.audio_tracks && project.audio_tracks.length > 0) {
      return project.audio_tracks;
    }

    return [];
  }, [project.project_files, project.audio_tracks]);

  // Group tracks by track group and prioritize MP3 files
  const trackGroups = useMemo(() => {
    // If no audio tracks, return empty array
    if (!audioTracks || audioTracks.length === 0) {
      return [];
    }

    const groups = new Map();


    audioTracks.forEach((track, index) => {
      // Get file extension to determine type - handle both Track type and extended type
      const fileName = (track as any).file_name || track.title || '';
      const audioUrl = track.audio_url || '';

      // Use audio URL if filename doesn't have extension, otherwise use filename
      const inputForType = fileName.includes('.') ? fileName : audioUrl;
      const fileType = getFileType(inputForType);

      // Group by correspondingTrackId if exists, otherwise by track title. Tracks with the same correspondingTrackId or title are considered variants of a single track group.
      const groupKey = (track as any).correspondingTrackId || track.title || `Track ${track.id}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          title: track.title,
          tracks: [],
          mp3Track: null,
          bestTrack: null // Fallback track if no MP3
        });
      }

      const group = groups.get(groupKey);
      group.tracks.push(track);

      // Prioritize MP3 for playback, but keep a fallback
      if (fileType === 'mp3') {
        group.mp3Track = track;
        group.bestTrack = track; // MP3 is the best option
      } else if (!group.bestTrack) {
        // If no MP3 found yet, use this track as fallback
        group.bestTrack = track;
      }
    });

    const result = Array.from(groups.values()).filter(group => group.bestTrack);

    return result;
  }, [audioTracks]);

  // Fallback: if no track groups are created, show original tracks as individual groups
  const displayGroups = useMemo(() => {
    if (trackGroups.length > 0) {
      return trackGroups;
    }

    // If no groups were created, create individual groups from audioTracks
    if (audioTracks.length > 0) {
      return audioTracks.map(track => ({
        id: track.id,
        title: track.title || `Track ${track.id}`,
        tracks: [track],
        mp3Track: null,
        bestTrack: track
      }));
    }

    return [];
  }, [trackGroups, audioTracks]);


  const totalTracks = displayGroups.length
  const visibleTracks = showAllTracks ? displayGroups : displayGroups.slice(0, 3)

  const getProjectStats = () => {
    const stats = {
      tracks: displayGroups.length,
      notes: notesCount,
      contracts: contracts.length,
      files: projectFiles.length,
      gems: project.gems || 0,
      streams: project.streams || 0
    }
    return stats
  }

  const stats = getProjectStats()

  if (variant === 'list') {
    return (
      <div
        className={`group relative bg-background border rounded-xl p-4 hover:shadow-lg transition-all duration-300 w-full flex items-center gap-4 cursor-pointer ${
          isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'hover:shadow-md'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {displayGroups.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayTrack(displayGroups[0])
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              {currentTrack?.id === (displayGroups[0].mp3Track || displayGroups[0].bestTrack)?.id && isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-1 text-foreground">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {project.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/view/${project.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {user && user.id === project.user_id && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
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

          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Music className="h-3 w-3" />
              <span>{stats.tracks} tracks</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateRelative(project.created_at)}
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.streams} streams</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gem className="h-3 w-3 text-purple-500" />
              <span>{stats.gems} gems</span>
            </div>
          </div>

        </div>

        <StudioProjectEditDialog
          project={project}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onProjectUpdated={() => {
            fetchNotesCount()
            fetchContracts()
            fetchProjectFiles()
            if (onEdit) {
              onEdit(project)
            }
          }}
        />

        {/* File Selector Dialog */}
        {showFileSelector && (
          <Dialog open={showFileSelector} onOpenChange={setShowFileSelector}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Attach Files to Project</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileSelector(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select files from your library to attach to this project
                  </p>

                  {availableFiles.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No files available to attach</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload files first in the Files section
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      {availableFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                            selectedFileIds.includes(file.id) ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleFileToggle(file.id)}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                            selectedFileIds.includes(file.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border'
                          }`}>
                            {selectedFileIds.includes(file.id) && <Check className="h-3 w-3" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium truncate text-sm">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>{file.file_type?.toUpperCase() || 'FILE'}</span>
                              <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}</span>
                              <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileToggle(file.id)
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            {selectedFileIds.includes(file.id) ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFileIds.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} selected
                      </span>
                      <Button onClick={handleAttachFiles}>
                        Attach Files
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }
  return (
    <div
      className={`group relative bg-background border rounded-xl p-4 hover:shadow-lg transition-all duration-300 w-full flex flex-col h-[380px] cursor-pointer ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-xl' : 'hover:border-primary/30 hover:-translate-y-1'
      }`}
      style={{ width: '340px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Header with Title and Actions */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 flex items-center justify-center shrink-0 shadow-sm">
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-10 h-10 object-cover rounded-lg"
              />
            ) : (
              <Music className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base line-clamp-1 text-foreground mb-1">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => navigate(`/view/${project.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {user && user.id === project.user_id && (
              <>
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
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

      {/* Main Content - Centered Attachments Section */}
      <div className="flex-1 flex flex-col">
        {/* Prominent Attachments Section */}
        <div className="bg-gradient-to-br from-muted/40 via-muted/20 to-background/80 rounded-xl p-4 mb-4 border border-border/50 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Project Assets
            </h4>
            {user && user.id === project.user_id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFileSelector(true)
                  }}
                  className="h-6 px-2 text-xs hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Files
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowEditDialog(true)
                  }}
                  className="h-6 px-2 text-xs hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Contracts
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Notes */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (user && user.id === project.user_id) {
                  setShowEditDialog(true)
                }
              }}
              className={`group/asset flex flex-col items-center gap-2 p-3 rounded-lg bg-background/60 hover:bg-background border border-border/30 hover:border-primary/30 transition-all duration-200 hover:shadow-md ${
                user && user.id === project.user_id ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover/asset:bg-blue-500/20 transition-colors">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">{notesCount}</span>
                <p className="text-xs text-muted-foreground font-medium">Notes</p>
              </div>
            </button>

            {/* Contracts */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (user && user.id === project.user_id) {
                  setShowEditDialog(true)
                }
              }}
              className={`group/asset flex flex-col items-center gap-2 p-3 rounded-lg bg-background/60 hover:bg-background border border-border/30 hover:border-primary/30 transition-all duration-200 hover:shadow-md ${
                user && user.id === project.user_id ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center group-hover/asset:bg-green-500/20 transition-colors">
                <FileSignature className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">{contracts.length}</span>
                <p className="text-xs text-muted-foreground font-medium">Contracts</p>
              </div>
            </button>

            {/* Files */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (user && user.id === project.user_id) {
                  setShowFileSelector(true)
                }
              }}
              className={`group/asset flex flex-col items-center gap-2 p-3 rounded-lg bg-background/60 hover:bg-background border border-border/30 hover:border-primary/30 transition-all duration-200 hover:shadow-md ${
                user && user.id === project.user_id ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover/asset:bg-purple-500/20 transition-colors">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">{projectFiles.length}</span>
                <p className="text-xs text-muted-foreground font-medium">Files</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tracks Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Tracks ({stats.tracks})</span>
          </div>

          {visibleTracks.length > 0 ? (
            <div className="flex-1 flex flex-col">
              <div className="space-y-1 overflow-auto flex-1">
                {visibleTracks.map((group: any, index: number) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 p-2 rounded-lg text-xs hover:bg-muted/30 transition-colors group/track border border-border/20 hover:border-primary/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayTrack(group)
                    }}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-primary/10 rounded-full group-hover/track:bg-primary/20 transition-colors">
                      {currentTrack?.id === (group.mp3Track || group.bestTrack)?.id && isPlaying ? (
                        <Pause className="h-3 w-3 text-primary" />
                      ) : (
                        <Play className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="truncate font-medium flex-1">
                      {group.title ? group.title.replace(/\.[^/.]+$/, "") : 'Untitled'}
                    </span>
                    {(group.mp3Track || group.bestTrack)?.duration && (
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 bg-muted/50 px-1.5 py-0.5 rounded">
                        {formatDuration((group.mp3Track || group.bestTrack).duration)}
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
                  className="text-xs text-muted-foreground hover:text-primary mt-2 font-medium flex-shrink-0 transition-colors"
                >
                  {showAllTracks ? 'Show less' : `+${totalTracks - 3} more tracks`}
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-6">
              <Music className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">No tracks available</p>
              <p className="text-xs text-center mt-1">Add audio files to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Creator Info */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-border/50">
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
              <p className="text-sm font-medium truncate">
                {creator.name}
              </p>
              {creator.professional_title && (
                <p className="text-xs text-muted-foreground truncate">
                  {creator.professional_title}
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              <Clock className="h-3 w-3 mr-1" />
              {formatDateRelative(project.created_at)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
