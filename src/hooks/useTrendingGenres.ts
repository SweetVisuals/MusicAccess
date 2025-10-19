import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TrendingGenre {
  name: string;
  count: number;
  color: string;
}

export const useTrendingGenres = (limit: number = 6) => {
  const [genres, setGenres] = useState<TrendingGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingGenres = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get projects with genre information
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('genre, created_at')
        .not('genre', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000); // Get recent projects to analyze trends

      if (projectsError) {
        console.error('Error fetching projects for genres:', projectsError);
        throw projectsError;
      }

      if (!projectsData || projectsData.length === 0) {
        // Fallback to default genres if no data
        setGenres([
          { name: "Lo-Fi", count: 0, color: "bg-blue-500" },
          { name: "Trap", count: 0, color: "bg-purple-500" },
          { name: "House", count: 0, color: "bg-green-500" },
          { name: "R&B", count: 0, color: "bg-orange-500" },
          { name: "Electronic", count: 0, color: "bg-pink-500" },
          { name: "Hip Hop", count: 0, color: "bg-red-500" }
        ].slice(0, limit));
        return;
      }

      // Count genres
      const genreCounts: Record<string, number> = {};
      projectsData.forEach(project => {
        if (project.genre) {
          // Handle both single genre strings and potential arrays
          const genres = Array.isArray(project.genre) ? project.genre : [project.genre];
          genres.forEach(g => {
            if (g && typeof g === 'string') {
              genreCounts[g] = (genreCounts[g] || 0) + 1;
            }
          });
        }
      });

      // Define color mapping for common genres
      const genreColors: Record<string, string> = {
        "Lo-Fi": "bg-blue-500",
        "Trap": "bg-purple-500",
        "House": "bg-green-500",
        "R&B": "bg-orange-500",
        "Electronic": "bg-pink-500",
        "Hip Hop": "bg-red-500",
        "Pop": "bg-yellow-500",
        "Rock": "bg-gray-500",
        "Jazz": "bg-indigo-500",
        "Classical": "bg-teal-500",
        "Reggae": "bg-lime-500",
        "Country": "bg-amber-500",
        "Funk": "bg-cyan-500",
        "Soul": "bg-rose-500",
        "default": "bg-slate-500"
      };

      // Convert to array and sort by count
      const trendingGenres: TrendingGenre[] = Object.entries(genreCounts)
        .map(([name, count]) => ({
          name,
          count,
          color: genreColors[name] || genreColors.default
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // If we don't have enough genres from the data, fill with defaults
      if (trendingGenres.length < limit) {
        const defaultGenres = [
          { name: "Lo-Fi", count: 0, color: "bg-blue-500" },
          { name: "Trap", count: 0, color: "bg-purple-500" },
          { name: "House", count: 0, color: "bg-green-500" },
          { name: "R&B", count: 0, color: "bg-orange-500" },
          { name: "Electronic", count: 0, color: "bg-pink-500" },
          { name: "Hip Hop", count: 0, color: "bg-red-500" }
        ];

        // Add defaults that aren't already in the list
        const existingNames = new Set(trendingGenres.map(g => g.name));
        const additionalGenres = defaultGenres
          .filter(g => !existingNames.has(g.name))
          .slice(0, limit - trendingGenres.length);

        trendingGenres.push(...additionalGenres);
      }

      setGenres(trendingGenres);
    } catch (err) {
      console.error('Error fetching trending genres:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trending genres');

      // Fallback to default genres on error
      setGenres([
        { name: "Lo-Fi", count: 0, color: "bg-blue-500" },
        { name: "Trap", count: 0, color: "bg-purple-500" },
        { name: "House", count: 0, color: "bg-green-500" },
        { name: "R&B", count: 0, color: "bg-orange-500" },
        { name: "Electronic", count: 0, color: "bg-pink-500" },
        { name: "Hip Hop", count: 0, color: "bg-red-500" }
      ].slice(0, limit));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingGenres();
  }, [limit]);

  return { genres, loading, error, refetch: fetchTrendingGenres };
};