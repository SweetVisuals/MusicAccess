import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types';

export const useAchievements = (userId?: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('year', { ascending: false });

        if (error) {
          throw error;
        }

        setAchievements(data || []);
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert([{ ...achievement, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      setAchievements(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding achievement:', err);
      throw err;
    }
  };

  const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAchievements(prev => prev.map(achievement =>
        achievement.id === id ? data : achievement
      ));
      return data;
    } catch (err) {
      console.error('Error updating achievement:', err);
      throw err;
    }
  };

  const deleteAchievement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAchievements(prev => prev.filter(achievement => achievement.id !== id));
    } catch (err) {
      console.error('Error deleting achievement:', err);
      throw err;
    }
  };

  return {
    achievements,
    loading,
    error,
    addAchievement,
    updateAchievement,
    deleteAchievement,
  };
};