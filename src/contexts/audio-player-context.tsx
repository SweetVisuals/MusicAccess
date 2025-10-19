import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';

import { Project, DatabaseFile, Track as LibTrack } from '@/lib/types'; // Import Project and DatabaseFile types

export type Track = LibTrack & {
  duration: number; // Changed from string to number
  artworkUrl?: string;
  artist?: string;
  projectTitle?: string;
  audioUrl?: string; // URL to the audio file
  file_url?: string; // Alternative URL field from database
  file_path?: string; // Path to the file in storage for signed URLs
  noteId?: string; // ID of the note this track is attached to
  attachedFiles?: DatabaseFile[]; // Files attached to the note
  attachedProject?: Project; // Project attached to the note
};

type AudioPlayerContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  setCurrentTrack: (track: Track | null) => void; // Add setCurrentTrack to the type
};

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  playTrack: () => {},
  togglePlay: () => {},
  progress: 0,
  duration: 0,
  seek: () => {},
  setCurrentTrack: () => {}, // Initialize setCurrentTrack
});

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { user } = useAuth();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStreamTimeRef = useRef<Map<string, number>>(new Map()); // Track last stream time per track-user combination
  const playbackStartTimeRef = useRef<number>(0);
  
  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);
  
  // Update audio source when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      // Use the track's audio URL or file_url as fallback
      const audioSource = currentTrack.audioUrl || currentTrack.audio_url || currentTrack.file_url || '';


      if (!audioSource) {
        console.error('No audio source available for track:', currentTrack);
        return;
      }

      audioRef.current.src = audioSource;
      audioRef.current.load(); // Ensure the audio loads properly

      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack, isPlaying]);

  // Reset stream tracking when user changes
  useEffect(() => {
    lastStreamTimeRef.current.clear();
    playbackStartTimeRef.current = 0;
  }, [user?.id]);
  
  const updateProgress = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setProgress(currentTime);

      // Check if we should count a stream (8+ seconds played with rate limiting)
      if (currentTrack && user && currentTime >= 8) {
        const streamKey = `${user.id}-${currentTrack.id}`;
        const lastStreamTime = lastStreamTimeRef.current.get(streamKey) || 0;
        const now = Date.now();
        const timeSinceLastStream = now - lastStreamTime;

        // Rate limit: allow streams every 30 seconds minimum to prevent botting
        if (timeSinceLastStream >= 30000) {
          // Update last stream time
          lastStreamTimeRef.current.set(streamKey, now);

          // Log the stream event to database
          supabase.from('track_streams').insert({
            track_id: currentTrack.id,
            user_id: user.id,
            streams: 1 // Count this as 1 stream
          }).then(({ error }) => {
            if (error) {
              console.error('Error logging track stream:', error);
              // If there was an error, allow retry by not updating the timestamp
              lastStreamTimeRef.current.delete(streamKey);
            }
          });
        }
      }
    }
  };
  
  const updateDuration = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    // Reset playback start time
    playbackStartTimeRef.current = 0;
  };
  
  const handleError = (e: Event) => {
    console.error('Error playing audio:', e);
    setIsPlaying(false);
  };

  const playTrack = async (track: Track) => {
    // If it's the same track, just toggle play/pause
    if (currentTrack && currentTrack.id === track.id) {
      togglePlay();
      return;
    }

    // Reset stream tracking for new track
    playbackStartTimeRef.current = Date.now();

    // Otherwise, set the new track and start playing
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <AudioPlayerContext.Provider 
      value={{ 
        currentTrack, 
        isPlaying, 
        playTrack, 
        togglePlay,
        progress,
        duration,
        seek,
        setCurrentTrack // Expose setCurrentTrack
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => useContext(AudioPlayerContext);
