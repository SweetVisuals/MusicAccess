'use client'

import { useState, useEffect, useMemo } from 'react'
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
  Link as LinkIcon,
  Unlink,
  FilePlus,
  Copy,
  Share,
  Star,
  FolderOpen,
  ExternalLink,
  Calendar,
  Clock,
  Upload,
  Plus,
  File,
  X
} from 'lucide-react'
import { useAudioPlayer } from '@/contexts/audio-player-context'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { type Project, type Contract, type DatabaseFile } from '@/lib/types'
import { formatDuration, formatDateRelative } from '@/lib/utils'
import { extractAndUpdateAudioDuration, getAudioDuration } from '@/lib/audio-utils'

interface StudioProjectCardProps {
  project: Project
  onDelete?: () => void
  onViewDetails?: () => void
  onEdit?: (project: Project) => void
  isSelected?: boolean
}

const StudioProjectCard = ({ project, onDelete, onViewDetails, onEdit, isSelected = false }: StudioProjectCardProps) => {
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

  const { user } = useAuth()
  const { currentTrack, playTrack, togglePlay, isPlaying } = useAudioPlayer()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [contractsCount, setContractsCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(project.title)
  const [editedDescription, setEditedDescription] = useState(project.description || '')
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({})
  const [projectAudioTracks, setProjectAudioTracks] = useState<any[]>(project.audio_tracks || [])
  const [trackVariants, setTrackVariants] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notes, setNotes] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [showAddContractDialog, setShowAddContractDialog] = useState(false)
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false)
  const [newContractTitle, setNewContractTitle] = useState('')
  const [newContractDescription, setNewContractDescription] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')

  const audioTrackMap = useMemo(() => {
    if (!projectAudioTracks.length) return new Map();
    // Map audio_tracks by audio_url for quick lookup
    return new Map(projectAudioTracks.map(track => [track.audio_url, track]));
  }, [projectAudioTracks]);

  const fileToTrackMap = useMemo(() => {
    const map = new Map();
    trackVariants.forEach(tv => {
      if (tv.audio_tracks) {
        map.set(tv.file_id, tv.audio_tracks);
      }
    });
    return map;
  }, [trackVariants]);

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
          const correspondingTrack = fileToTrackMap.get(pf.file_id) || audioTrackMap.get(fileUrl);

          return {
            id: correspondingTrack?.id || pf.id,
            // Prioritize the title from audio_tracks (which contains the group name if set)
            title: correspondingTrack?.title || pf.files.name || pf.files.title || `Track ${pf.id}`,
            audio_url: fileUrl,
            allow_download: pf.allow_downloads || false,
            price: pf.price || undefined,
            duration: trackDurations[pf.id] || correspondingTrack?.duration_seconds || pf.files.duration_seconds || correspondingTrack?.duration || pf.files.duration || 0,
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
  }, [project.project_files, fileToTrackMap]);

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

  const fetchAudioTracks = async () => {
    if (!project.id) return;

    try {
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('project_id', project.id);

      if (error) throw error;
      setProjectAudioTracks(data || []);
    } catch (error) {
      console.error('Error fetching audio tracks:', error);
    }
  };

  useEffect(() => {
    fetchContractsCount()
    fetchProjectNotes()
    fetchProjectContracts()
    fetchAudioTracks()
  }, [project.id])

  // Fetch audio tracks if not provided in project prop
  useEffect(() => {
    const fetchAudioTracks = async () => {
      if (!project.id) return;

      try {
        const { data, error } = await supabase
          .from('audio_tracks')
          .select('*')
          .eq('project_id', project.id);

        if (error) throw error;
        setProjectAudioTracks(data || []);
      } catch (error) {
        console.error('Error fetching audio tracks:', error);
      }
    };

    if (!project.audio_tracks || project.audio_tracks.length === 0) {
      fetchAudioTracks();
    }
  }, [project.id, project.audio_tracks]);

  // Fetch track variants
  useEffect(() => {
    const fetchTrackVariants = async () => {
      if (!project.id || !project.project_files?.length) {
        setTrackVariants([]);
        return;
      }

      try {
        const fileIds = project.project_files.map(pf => pf.file_id);
        const { data, error } = await supabase
          .from('track_variants')
          .select('*, audio_tracks(*)')
          .in('file_id', fileIds);

        if (error) throw error;
        setTrackVariants(data || []);
      } catch (error) {
        console.error('Error fetching track variants:', error);
      }
    };

    fetchTrackVariants();
  }, [project.id, project.project_files]);

  // Extract and update durations for tracks that don't have them
  useEffect(() => {
    const extractMissingDurations = async () => {
      if (!displayGroups || displayGroups.length === 0) return;

      const tracksToUpdate = displayGroups
        .map(group => group.bestTrack)
        .filter(track => track && (!track.duration_seconds || track.duration_seconds === 0) && track.audio_url)
        .map(track => ({
          id: track!.id,
          audio_url: track!.audio_url,
          file_id: (track as any).file_id
        }));

      if (tracksToUpdate.length === 0) return;

      for (const track of tracksToUpdate) {
        try {
          const duration = await getAudioDuration(track.audio_url);
          if (duration && duration > 0) {
            // Update the local state immediately for better UX
            setTrackDurations(prev => ({
              ...prev,
              [track.id]: duration
            }));

            // Update the database in the background
            extractAndUpdateAudioDuration(track.audio_url, track.id, track.file_id)
              .then(() => {
                console.log(`Updated duration for track ${track.id}: ${duration}s`);
              })
              .catch(error => {
                console.error('Error updating duration in database:', error);
              });
          }
        } catch (error) {
          console.error('Error extracting duration for track:', track.id, error);
        }
      }
    };

    extractMissingDurations();
  }, [displayGroups]);

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


  const handleFileUpload = async (file: File) => {
    if (!user || !project.id) {
      toast.error("Please sign in to upload files")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const fileId = crypto.randomUUID()
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${fileId}.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio_files')
        .getPublicUrl(filePath)

      // Create file record
      const { error: fileError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          size: file.size,
          file_type: file.type.startsWith('audio/') ? 'audio' : 'file',
          user_id: user.id,
          folder_id: null
        })

      if (fileError) throw fileError

      // Create audio track record
      const { error: trackError } = await supabase
        .from('audio_tracks')
        .insert({
          project_id: project.id,
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          audio_url: publicUrl,
          duration_seconds: 0
        })

      if (trackError) throw trackError

      toast.success("File uploaded successfully")
      setShowUploadDialog(false)
      
      // Refresh tracks
      fetchAudioTracks()
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCreateContract = async () => {
    if (!user || !project.id || !newContractTitle.trim()) {
      toast.error("Please provide a contract title")
      return
    }

    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          title: newContractTitle,
          description: newContractDescription,
          type: 'audio',
          status: 'draft'
        })
        .select()
        .single()

      if (contractError) throw contractError

      const { error: projectContractError } = await supabase
        .from('project_contracts')
        .insert({
          project_id: project.id,
          contract_id: contractData.id,
          user_id: user.id
        })

      if (projectContractError) throw projectContractError

      toast.success("Contract created successfully")
      setShowAddContractDialog(false)
      setNewContractTitle('')
      setNewContractDescription('')
      fetchProjectContracts()
      fetchContractsCount()
    } catch (error) {
      console.error('Error creating contract:', error)
      toast.error("Failed to create contract")
    }
  }

  const handleCreateNote = async () => {
    if (!user || !project.id || !newNoteTitle.trim()) {
      toast.error("Please provide a note title")
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          project_id: project.id,
          title: newNoteTitle,
          content: newNoteContent
        })

      if (error) throw error

      toast.success("Note created successfully")
      setShowAddNoteDialog(false)
      setNewNoteTitle('')
      setNewNoteContent('')
      fetchProjectNotes()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error("Failed to create note")
    }
  }

  const handleEditProject = async () => {
    if (!user) {
      toast.error("Please sign in to edit projects")
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editedTitle,
          description: editedDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      toast.success("Project updated successfully")
      setIsEditing(false)
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error("Failed to update project")
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(project.title)
    setEditedDescription(project.description || '')
    setIsEditing(false)
  }


  // Get project files instead of audio tracks for studio display
  const projectFiles = project.project_files || []
  const totalFiles = projectFiles.length

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
          duration: trackDurations[trackToPlay.id] || trackToPlay.duration_seconds || trackToPlay.duration || 0,
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

  const getProjectStats = () => {
    const stats = {
      tracks: displayGroups.length,
      files: totalFiles,
      contracts: contractsCount
    }
    return stats
  }

  const stats = getProjectStats()

  return (
    <>
      <style>
        {`
          .custom-scroll::-webkit-scrollbar {
            width: 1px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgb(156 163 175);
            border-radius: 0.5px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgb(107 114 128);
          }
        `}
      </style>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`group relative bg-background border rounded-xl p-5 hover:shadow-lg transition-all duration-300 w-full flex flex-col cursor-pointer ${
              isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'hover:shadow-md'
            }`}
            onClick={() => onViewDetails && onViewDetails()}
          >
          {/* Project Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full text-base font-semibold bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Project title"
                  />
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Project description"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditProject} className="h-8 text-sm">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 text-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to={`/view/${project.id}`} className="hover:underline">
                    <h3 className="font-semibold text-base line-clamp-2 leading-tight text-foreground">
                      {project.title}
                    </h3>
                  </Link>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                </>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0">
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
                    <DropdownMenuItem onClick={() => onEdit ? onEdit(project) : setIsEditing(true)}>
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

          {/* Project Cover Image (if available) */}
          {project.cover_image_url && (
            <div className="mb-4 rounded-lg overflow-hidden aspect-video bg-muted/50">
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Stats Overview with improved design */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <Music className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{stats.tracks}</p>
                <p className="text-xs text-muted-foreground">tracks</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <div className="p-1.5 bg-blue-500/10 rounded-full">
                <FileText className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium">{stats.files}</p>
                <p className="text-xs text-muted-foreground">files</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <div className="p-1.5 bg-green-500/10 rounded-full">
                <FileSignature className="h-3 w-3 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium">{stats.contracts}</p>
                <p className="text-xs text-muted-foreground">contracts</p>
              </div>
            </div>
          </div>


          {/* Track Groups List */}
          <div className="flex-1 overflow-hidden">
            <div className="h-48 bg-background/50 rounded-lg p-1 custom-scroll overflow-y-auto">
              <div className="space-y-0.5">
                {displayGroups.length > 0 ? (
                  displayGroups.map((group, index) => (
                    <div key={group.id} className="flex items-center">
                      <div className="flex items-center w-full">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePlayTrack(group);
                          }}
                          onPointerDown={(e) => {
                            // Prevent drag events from interfering with clicks
                            if (e.pointerType === 'mouse') {
                              e.preventDefault();
                            }
                          }}
                          draggable={false}
                          onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className={`flex-grow flex items-center gap-2 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left min-w-0 ${
                            currentTrack?.id === (group.mp3Track || group.bestTrack)?.id
                              ? 'bg-black text-white font-medium shadow-lg'
                              : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <span className={`text-xs tabular-nums w-6 shrink-0 ${currentTrack?.id === (group.mp3Track || group.bestTrack)?.id ? 'text-white/80' : 'text-muted-foreground/60 group-hover/track:text-white/80'}`}>{index + 1}.</span>
                            <span className={`text-xs tabular-nums w-10 shrink-0 ${currentTrack?.id === (group.mp3Track || group.bestTrack)?.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{formatDuration(trackDurations[(group.mp3Track || group.bestTrack)?.id] || (group.mp3Track || group.bestTrack)?.duration_seconds || (group.mp3Track || group.bestTrack)?.duration || 0)}</span>
                            <span className="truncate text-sm group-hover/track:text-white transition-colors">
                              {group.title}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No tracks available
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Footer with Creator Info and Metadata */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Link 
                to={`/user/${creator.username}`} 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
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
              
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {formatDateRelative(project.created_at)}
                </Badge>
              </div>
            </div>
            
            {/* Project Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px] px-2 py-0">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    +{project.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        {/* Context Menu */}
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => navigate(`/view/${project.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </ContextMenuItem>
          {user && user.id === project.user_id && (
            <>
              <ContextMenuItem onClick={() => onEdit ? onEdit(project) : setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </ContextMenuItem>
              <ContextMenuItem onClick={handleDownloadProject}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </ContextMenuItem>
              <ContextMenuItem
                className="text-destructive"
                onClick={handleDeleteProject}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* File Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Track</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowUploadDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop audio files here
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : 'Choose File'}
                </Button>
              </div>
              {isUploading && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Dialog */}
      {showAddContractDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Contract</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddContractDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Contract Title</label>
                <input
                  type="text"
                  value={newContractTitle}
                  onChange={(e) => setNewContractTitle(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Enter contract title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea
                  value={newContractDescription}
                  onChange={(e) => setNewContractDescription(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1 resize-none"
                  placeholder="Enter contract description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddContractDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateContract}
                  disabled={!newContractTitle.trim()}
                  className="flex-1"
                >
                  Create Contract
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Dialog */}
      {showAddNoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Note</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddNoteDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Note Title</label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Enter note title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1 resize-none"
                  placeholder="Enter note content"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddNoteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNoteTitle.trim()}
                  className="flex-1"
                >
                  Create Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StudioProjectCard
