import { supabase } from './supabase';

/**
 * Extracts the duration of an audio file and updates the database
 */
export async function extractAndUpdateAudioDuration(
  fileUrl: string, 
  trackId?: string, 
  fileId?: string
): Promise<number | null> {
  try {
    // Create an audio element to get the duration
    const audio = new Audio(fileUrl);
    
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', async () => {
        const durationSeconds = Math.floor(audio.duration);
        
        if (trackId && durationSeconds > 0) {
          // Update audio_tracks table
          const { error: trackError } = await supabase
            .rpc('update_audio_duration', {
              p_track_id: trackId,
              p_duration_seconds: durationSeconds
            });
          
          if (trackError) {
            console.error('Error updating audio track duration:', trackError);
          }
        }
        
        if (fileId && durationSeconds > 0) {
          // Update files table
          const { error: fileError } = await supabase
            .rpc('update_file_duration_seconds', {
              p_file_id: fileId,
              p_duration_seconds: durationSeconds
            });
          
          if (fileError) {
            console.error('Error updating file duration:', fileError);
          }
        }
        
        resolve(durationSeconds);
      });
      
      audio.addEventListener('error', () => {
        console.error('Error loading audio file for duration extraction');
        resolve(null);
      });
      
      // Set a timeout in case the audio doesn't load
      setTimeout(() => {
        resolve(null);
      }, 10000); // 10 second timeout
    });
  } catch (error) {
    console.error('Error extracting audio duration:', error);
    return null;
  }
}

/**
 * Extracts duration for multiple audio files
 */
export async function extractDurationsForTracks(tracks: Array<{
  id: string;
  audio_url: string;
  file_id?: string;
}>) {
  const promises = tracks.map(track => 
    extractAndUpdateAudioDuration(track.audio_url, track.id, track.file_id)
  );
  
  return Promise.all(promises);
}

/**
 * Gets duration from an audio file URL without updating database
 */
export function getAudioDuration(fileUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio(fileUrl);
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(Math.floor(audio.duration));
    });
    
    audio.addEventListener('error', () => {
      console.error('Error loading audio file for duration extraction');
      resolve(null);
    });
    
    // Set a timeout in case the audio doesn't load
    setTimeout(() => {
      resolve(null);
    }, 10000);
  });
}