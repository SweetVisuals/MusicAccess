import { Button } from "@/components/@/ui/button"
import { Input } from "@/components/@/ui/input"
import { ScrollArea } from "@/components/@/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/@/ui/avatar"
import { Play, Pause, Volume2, Gem, SkipBack, SkipForward, ChevronDown, Maximize2, X, ChevronUp, MessageCircle, Send, FileText } from 'lucide-react'
import { useAudioPlayer } from '@/contexts/audio-player-context'
import { useEffect, useState } from "react"
import { Progress } from "@/components/@/ui/progress"
import { motion, AnimatePresence } from 'framer-motion'
import { useListeningSessions } from "@/hooks/useListeningSessions"
import { useMessaging } from '@/contexts/messaging-context'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/auth-context'
import { useGemsBalance } from '@/contexts/gems-balance-context'
import { useGivenGems } from '@/hooks/useGivenGems'
import { useNotes } from '@/contexts/notes-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Compact messaging interface for the audio player
function MessagingInterface() {
  const { user } = useAuth()
  const { selectedUser, conversationId, closeMessaging } = useMessaging()
  const { messages, loading, sendMessage: sendMessageHook } = useMessages(user?.id || '')
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || isSending) return

    setIsSending(true)
    try {
      const result = await sendMessageHook(conversationId, newMessage.trim())
      if (result.success) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-3">
      {selectedUser && (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={selectedUser.avatarUrl} />
            <AvatarFallback className="text-xs">
              {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {selectedUser.full_name || selectedUser.username}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="h-32">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-muted-foreground">Loading...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                Start a conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.slice(-5).map((message: any) => ( // Show last 5 messages
              <div
                key={message.id}
                className={`flex gap-1 ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded px-2 py-1 text-xs ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 h-8 text-sm"
          disabled={isSending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          size="sm"
          className="h-8 px-3"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function AudioPlayer() {
     const { currentTrack, isPlaying, togglePlay, progress, duration, seek, setCurrentTrack } = useAudioPlayer()
     const { isOpen: messagingOpen, selectedUser, openGeneralMessaging } = useMessaging()
     const { openNewNote } = useNotes()
     const { user } = useAuth()
     const { gemsBalance, refetch: refetchGemsBalance } = useGemsBalance()
     const { giveGems } = useGivenGems()

     // Track listening session
     useListeningSessions(isPlaying ? currentTrack ?? null : null)
     const [volume, setVolume] = useState(100)
     const [showVolumeSlider, setShowVolumeSlider] = useState(false)
     const [showPlayer, setShowPlayer] = useState(true)
     const [currentTrackGemCount, setCurrentTrackGemCount] = useState(0)
  
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const percentage = clickPosition / rect.width
    const newTime = percentage * duration
    
    seek(newTime)
  }
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    
    // Update actual audio volume
    const audioElement = document.querySelector('audio')
    if (audioElement) {
      audioElement.volume = newVolume / 100
    }
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
    // Do NOT set currentTrack to null here. Keep it so the player can be reopened with the same track.
  }

  // Fetch gem count for current track
  useEffect(() => {
    const fetchTrackGemCount = async () => {
      if (!currentTrack?.id) {
        setCurrentTrackGemCount(0)
        return
      }

      try {
        // Get gems received by this specific track
        const { data: gemEvents, error: gemError } = await supabase
          .from('analytics')
          .select('track_id')
          .eq('event_type', 'gem_given')
          .eq('track_id', currentTrack.id)

        if (gemError) {
          console.error('Error fetching gem count:', gemError)
          setCurrentTrackGemCount(0)
        } else {
          setCurrentTrackGemCount(gemEvents?.length || 0)
        }
      } catch (error) {
        console.error('Error in fetchTrackGemCount:', error)
        setCurrentTrackGemCount(0)
      }
    }

    fetchTrackGemCount()
  }, [currentTrack?.id])

  // Listen for track gem updates from other components
  useEffect(() => {
    const handleTrackGemUpdate = (event: CustomEvent) => {
      const { trackId, gemCount } = event.detail
      if (currentTrack?.id === trackId) {
        setCurrentTrackGemCount(gemCount)
      }
    }

    window.addEventListener('track-gem-update', handleTrackGemUpdate as EventListener)

    return () => {
      window.removeEventListener('track-gem-update', handleTrackGemUpdate as EventListener)
    }
  }, [currentTrack?.id])

  const handleGiveGem = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error("Please sign in to give gems")
      return
    }

    if (!currentTrack) {
      toast.error("No track is currently playing")
      return
    }

    if (user.id === currentTrack.user_id) {
      toast.error("You cannot give gems to your own tracks")
      return
    }

    if (gemsBalance <= 0) {
      toast.error("You don't have any gems to give")
      return
    }

    // Check if user has already given a gem to this track
    try {
      const { data: existingGems, error: checkError } = await supabase
        .from('given_gems')
        .select('id')
        .eq('giver_id', user.id)
        .eq('track_id', currentTrack.id)
        .eq('status', 'active')
        .limit(1)

      if (checkError) {
        console.error('Error checking existing gems:', checkError)
        toast.error("Failed to check gem status")
        return
      }

      if (existingGems && existingGems.length > 0) {
        toast.error("You have already given a gem to this track")
        return
      }

      const result = await giveGems(currentTrack.user_id, 1, currentTrack.id)
      toast.success(`Gave 1 gem to this track!`)

      // Update local state
      setCurrentTrackGemCount(prev => prev + 1)

      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('track-gem-update', {
        detail: { trackId: currentTrack.id, gemCount: currentTrackGemCount + 1 }
      }))

      refetchGemsBalance()
    } catch (error) {
      console.error('Error giving gem:', error)
      toast.error("Failed to give gem")
    }
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="player"
          initial={{ y: '100%' }}
          animate={currentTrack && showPlayer ? { y: 0 } : { y: '100%' }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-0 left-0 md:left-[var(--sidebar-width)] right-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-[50] transition-all duration-200 ease-in-out shadow-[0_-8px_32px_rgba(0,0,0,0.4)] transform translate-z-0
            ${!currentTrack ? 'pointer-events-none' : ''}`}>
          <div className="container mx-auto px-4 py-3 h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 w-full">
               {/* Track Info */}
               {currentTrack && (
                 <div className="flex items-center gap-3 min-w-0 w-[200px]">
                   {currentTrack.artworkUrl && (
                     <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                       <img
                         src={currentTrack.artworkUrl}
                         alt={currentTrack.title}
                         className="w-full h-full object-cover"
                       />
                     </div>
                   )}
                   <div className="min-w-0 flex-1">
                     <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                     {currentTrack.projectTitle && (
                       <p className="text-xs text-muted-foreground truncate">
                         {currentTrack.projectTitle}
                       </p>
                     )}
                   </div>
                 </div>
               )}

              {/* Playback Controls */}
              <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                    onClick={togglePlay}
                  >
                    <motion.div
                      key={isPlaying ? "pause" : "play"}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={!isPlaying ? "pl-[1px]" : ""}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="pl-[2px] h-4 w-4" />}
                    </motion.div>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="w-full flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                    {formatTime(progress)}
                  </span>
                  <div
                    className="flex-1 h-1 bg-muted rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-10">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center gap-3 w-[200px] justify-end">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>

                  {showVolumeSlider && (
                    <div className="absolute bottom-full mb-2 p-2 bg-background border rounded-md shadow-md">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center w-9">
                  <button
                    onClick={handleGiveGem}
                    className="w-[42px] p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-1 group/gem"
                    title={`Give a gem to this track`}
                  >
                    <Gem
                      className={`h-4 w-4 transition-colors ${
                        currentTrackGemCount > 0
                          ? 'text-violet-500'
                          : 'text-gray-400 hover:text-violet-500'
                      }`}
                    />
                    <span className={`text-xs font-medium tabular-nums transition-colors ${
                      currentTrackGemCount > 0
                        ? 'text-violet-500'
                        : 'text-gray-400 hover:text-violet-500'
                    }`}>
                      {currentTrackGemCount}
                    </span>
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleClosePlayer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {currentTrack && !showPlayer && (
          <motion.div
            key="popup"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-[50] flex justify-center items-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <Button 
              variant="default" 
              size="icon" 
              className="h-12 w-12 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              onClick={() => setShowPlayer(true)}
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}


