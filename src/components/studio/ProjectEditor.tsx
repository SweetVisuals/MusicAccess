'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Music,
  Upload,
  Trash2,
  Edit,
  Save,
  X,
  FileText,
  Download,
  Play,
  Pause,
  Volume2
} from 'lucide-react'
import { type Project, type Track } from '@/lib/types'

interface ProjectEditorProps {
  project: Project
  onClose: () => void
  onProjectUpdated: () => void
  onProjectDeleted: () => void
}

export default function ProjectEditor({ project, onClose, onProjectUpdated, onProjectDeleted }: ProjectEditorProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')
  const [tracks, setTracks] = useState<Track[]>(project.audio_tracks || [])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})

  useEffect(() => {
    if (project.audio_tracks) {
      setTracks(project.audio_tracks)
    }
  }, [project])

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Project updated successfully')
      onProjectUpdated()
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Project deleted successfully')
      onProjectDeleted()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = (trackId: string, audioUrl: string) => {
    if (currentlyPlaying === trackId) {
      // Pause current track
      if (audioElements[trackId]) {
        audioElements[trackId].pause()
      }
      setCurrentlyPlaying(null)
    } else {
      // Stop any currently playing track
      if (currentlyPlaying && audioElements[currentlyPlaying]) {
        audioElements[currentlyPlaying].pause()
      }

      // Play new track
      const audio = new Audio(audioUrl)
      audioElements[trackId] = audio
      setAudioElements({ ...audioElements, [trackId]: audio })

      audio.play()
      setCurrentlyPlaying(trackId)

      audio.onended = () => {
        setCurrentlyPlaying(null)
      }
    }
  }

  const handleDownloadTrack = (track: Track) => {
    if (track.audio_url) {
      const link = document.createElement('a')
      link.href = track.audio_url
      link.download = `${track.title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Manage your project details and audio tracks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Project description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audio Tracks */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                {tracks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No audio tracks</p>
                    <p className="text-xs mt-1">Add audio tracks to your project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => track.audio_url && handlePlayPause(track.id, track.audio_url)}
                            className={`p-2 rounded-full ${
                              currentlyPlaying === track.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                            } transition-colors`}
                          >
                            {currentlyPlaying === track.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{track.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {track.duration && (
                                <span>{formatDuration(track.duration)}</span>
                              )}
                              {track.price && (
                                <>
                                  <span>•</span>
                                  <span>${track.price}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {track.allow_download && track.audio_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadTrack(track)}
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Updated</div>
                    <div className="font-medium">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tracks</div>
                    <div className="font-medium">{tracks.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Visibility</div>
                    <div className="font-medium capitalize">{project.visibility || 'private'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
