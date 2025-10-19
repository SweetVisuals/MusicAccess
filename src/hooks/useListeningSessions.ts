import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

import { Track } from '@/lib/types';

export const useListeningSessions = (track: Track | null) => {
  const { user } = useAuth();

  const upsertListeningSession = useCallback(async () => {
    // Temporarily disable listening session tracking due to data inconsistencies
    // between tracks and audio_tracks tables
    return;

    if (!user || !track || !track.project_id) return;

    try {
      const { error } = await supabase.from('listening_sessions').upsert({
        track_id: track.id,
        user_id: user.id,
        last_active_at: new Date().toISOString(),
      });

      // Don't log errors for foreign key constraint violations
      // (which happen when trackId doesn't exist in audio_tracks)
      if (error) {
        const errorMessage = error.message || error.details || JSON.stringify(error);
        if (!errorMessage.includes('foreign key') && !errorMessage.includes('violates') && !errorMessage.includes('Conflict')) {
          console.error('Error upserting listening session:', error);
        }
      }
    } catch (err) {
      // Silently ignore network errors that are due to constraint violations
      // The browser console will still show the 409 error, but we won't log it here
    }
  }, [user, track]);

  const removeListeningSession = useCallback(async () => {
    if (!user || !track) return;

    const { error } = await supabase.from('listening_sessions').delete().match({
      track_id: track.id,
      user_id: user.id,
    });

    if (error) {
      console.error('Error removing listening session:', error);
    }
  }, [user, track]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user && track && track.project_id) {
      // Immediately record the session
      upsertListeningSession();

      // Update the session every 30 seconds to keep it "live"
      interval = setInterval(upsertListeningSession, 30000);

      // Clean up when the component unmounts or the track changes
      return () => {
        clearInterval(interval);
        removeListeningSession();
      };
    }

    // If there's no user or track, ensure no session is active
    return () => {
      clearInterval(interval);
    };
  }, [user, track, upsertListeningSession, removeListeningSession]);

  // This hook does not need to return anything as it's a "fire and forget" tracker.
};
