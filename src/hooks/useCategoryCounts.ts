import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CategoryCount {
  name: string;
  count: number;
}

export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryCounts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get counts for different categories based on project types and content
      const [
        { count: beatsCount, error: beatsError },
        { count: vocalsCount, error: vocalsError },
        { count: mixingCount, error: mixingError },
        { count: soundPacksCount, error: soundPacksError },
        { count: collaborateCount, error: collaborateError },
        { count: tutorialsCount, error: tutorialsError }
      ] = await Promise.all([
        // Beats & Instrumentals - count projects with relevant keywords in title/description
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%beat%,title.ilike.%instrumental%,description.ilike.%beat%,description.ilike.%instrumental%'),

        // Vocal Production - count projects with vocal-related keywords
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%vocal%,title.ilike.%singing%,description.ilike.%vocal%,description.ilike.%singing%'),

        // Mixing & Mastering - count projects with mixing/mastering keywords
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%mix%,title.ilike.%master%,description.ilike.%mix%,description.ilike.%master%'),

        // Sound Packs - count projects with sound pack keywords
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%sound pack%,title.ilike.%sample%,description.ilike.%sound pack%,description.ilike.%sample%'),

        // Collaborate - count projects with collaboration keywords
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%collab%,title.ilike.%feature%,description.ilike.%collab%,description.ilike.%feature%'),

        // Tutorials - count projects with tutorial keywords
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%tutorial%,title.ilike.%lesson%,description.ilike.%tutorial%,description.ilike.%lesson%')
      ]);

      if (beatsError || vocalsError || mixingError || soundPacksError || collaborateError || tutorialsError) {
        console.error('Errors fetching category counts:', {
          beatsError, vocalsError, mixingError, soundPacksError, collaborateError, tutorialsError
        });
        // Continue with available data
      }

      // Also get total projects count
      const { count: totalCount, error: totalError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total projects count:', totalError);
      }

      const counts: Record<string, number> = {
        "Beats & Instrumentals": beatsCount || 0,
        "Vocal Production": vocalsCount || 0,
        "Mixing & Mastering": mixingCount || 0,
        "Sound Packs": soundPacksCount || 0,
        "Collaborate": collaborateCount || 0,
        "Tutorials": tutorialsCount || 0,
        total: totalCount || 0
      };

      setCategoryCounts(counts);
    } catch (err) {
      console.error('Error fetching category counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load category counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  return { categoryCounts, loading, error, refetch: fetchCategoryCounts };
};