import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface PopularSearchesState {
  searches: string[];
  fetchPopularSearches: () => Promise<void>;
}

export const usePopularSearches = create<PopularSearchesState>((set) => ({
  searches: [],
  fetchPopularSearches: async () => {
    const { data, error } = await supabase
      .from('popular_searches')
      .select('query')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching popular searches:', error);
      return;
    }

    set({ searches: data.map((d) => d.query) });
  },
}));