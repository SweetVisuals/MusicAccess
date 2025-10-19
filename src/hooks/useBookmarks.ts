import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export interface Bookmark {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's bookmarks
  const fetchBookmarks = async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched bookmarks:', data);
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookmarks on mount and when user changes
  useEffect(() => {
    fetchBookmarks();
  }, [user?.id]); // Use user.id instead of user to prevent unnecessary re-fetches

  // Toggle bookmark for a project
  const toggleBookmark = async (projectId: string) => {
    if (!user) {
      toast.error('Please sign in to bookmark projects');
      return false;
    }

    // Validate projectId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      toast.error('Invalid project ID');
      return false;
    }

    try {
      // Call the database function
      const { data, error } = await supabase.rpc('toggle_bookmark', {
        user_uuid: user.id,
        project_uuid: projectId
      });

      if (error) throw error;

      // Update local state
      if (data) {
        // Bookmark was added
        const newBookmark: Bookmark = {
          id: `temp-${Date.now()}`, // Temporary ID until refetch
          user_id: user.id,
          project_id: projectId,
          created_at: new Date().toISOString()
        };
        setBookmarks(prev => [newBookmark, ...prev]);
        toast.success('Added to bookmarks');
      } else {
        // Bookmark was removed
        setBookmarks(prev => prev.filter(b => b.project_id !== projectId));
        toast.success('Removed from bookmarks');
      }

      // Refetch to get accurate data
      await fetchBookmarks();

      return data; // Return true if added, false if removed
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
      return false;
    }
  };

  // Check if a project is bookmarked
  const isBookmarked = (projectId: string) => {
    return bookmarks.some(bookmark => bookmark.project_id === projectId);
  };

  // Get bookmarked project IDs - memoized to prevent unnecessary re-renders
  const bookmarkedProjectIds = useMemo(() => {
    return bookmarks.map(b => b.project_id);
  }, [bookmarks]);

  return {
    bookmarks,
    loading,
    toggleBookmark,
    isBookmarked,
    bookmarkedProjectIds,
    refetch: fetchBookmarks
  };
}