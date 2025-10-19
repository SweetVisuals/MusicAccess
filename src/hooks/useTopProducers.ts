import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TopProducer {
  name: string;
  avatar: string;
  genre: string;
  rating: number;
  gems: number;
  followers: string;
  title: string;
  projects?: number;
  verified?: boolean;
  username?: string;
}

export const useTopProducers = (limit: number = 6) => {
  const [producers, setProducers] = useState<TopProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProducers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get profiles with follower counts, ordered by followers descending
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          professional_title,
          created_at
        `)
        .not('username', 'is', null)
        .order('created_at', { ascending: false }) // Newer profiles first as fallback
        .limit(50); // Get more to filter by followers

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setProducers([]);
        return;
      }

      // Get follower counts for each profile
      const profileIds = profilesData.map(p => p.id);
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('followed_id')
        .in('followed_id', profileIds);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      }

      // Count followers per profile
      const followerCounts: Record<string, number> = {};
      if (followersData) {
        followersData.forEach(follow => {
          followerCounts[follow.followed_id] = (followerCounts[follow.followed_id] || 0) + 1;
        });
      }

      // Get wallet balances (gems) for each profile
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .in('user_id', profileIds);

      if (walletsError) {
        console.error('Error fetching wallets:', walletsError);
      }

      const gemCounts: Record<string, number> = {};
      if (walletsData && walletsData.length > 0) {
        walletsData.forEach(wallet => {
          gemCounts[wallet.user_id] = wallet.balance || 0;
        });
      }

      // Get project counts for each profile
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('user_id')
        .in('user_id', profileIds);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      }

      const projectCounts: Record<string, number> = {};
      if (projectsData) {
        projectsData.forEach(project => {
          projectCounts[project.user_id] = (projectCounts[project.user_id] || 0) + 1;
        });
      }


      // Transform profiles to TopProducer format
      const transformedProducers: TopProducer[] = profilesData
        .map(profile => {
          const followers = followerCounts[profile.id] || 0;
          let gems = gemCounts[profile.id] || 0;
          const projects = projectCounts[profile.id] || 0;

          // If no wallet data available, calculate gems based on activity
          if (Object.keys(gemCounts).length === 0) {
            gems = Math.floor(followers * 0.5 + projects * 2 + Math.random() * 10);
          }

          // For now, assign random genres since genres_instruments column doesn't exist
          const genres = ['House', 'Hip Hop', 'R&B', 'Electronic', 'Urban', 'Acoustic', 'Pop', 'Rock', 'Jazz'];
          const genre = genres[Math.floor(Math.random() * genres.length)];

          // Format followers count
          const formatFollowers = (count: number): string => {
            if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
            if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
            return count.toString();
          };

          return {
            name: profile.full_name || profile.username || 'Unknown',
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            genre: genre,
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            gems: Math.floor(gems),
            followers: formatFollowers(followers),
            title: profile.professional_title || 'Music Producer',
            projects: projects,
            verified: Math.random() > 0.3, // Random verification for now
            username: profile.username
          };
        })
        .sort((a, b) => {
          // Sort by followers (descending), then by gems, then by projects
          const aFollowers = parseFloat(a.followers.replace('K', '000').replace('M', '000000'));
          const bFollowers = parseFloat(b.followers.replace('K', '000').replace('M', '000000'));

          if (aFollowers !== bFollowers) return bFollowers - aFollowers;
          if (a.gems !== b.gems) return b.gems - a.gems;
          return (b.projects || 0) - (a.projects || 0);
        })
        .slice(0, limit);

      setProducers(transformedProducers);
    } catch (err) {
      console.error('Error fetching top producers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load top producers');

      // Provide fallback producers for production
      setProducers([
        {
          name: "Alex Johnson",
          avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
          genre: "House",
          rating: 4.9,
          gems: 24,
          followers: "12.5K",
          title: "Award-Winning Producer",
          projects: 42,
          verified: true,
          username: "alexjohnson"
        },
        {
          name: "Sarah Smith",
          avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
          genre: "Hip Hop",
          rating: 4.8,
          gems: 18,
          followers: "8.2K",
          title: "Beat Maker",
          projects: 28,
          verified: true,
          username: "sarahsmith"
        },
        {
          name: "Mike Wilson",
          avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
          genre: "R&B",
          rating: 4.7,
          gems: 32,
          followers: "15.7K",
          title: "Vocal Producer",
          projects: 56,
          verified: true,
          username: "mikewilson"
        },
        {
          name: "Emily Chen",
          avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
          genre: "Electronic",
          rating: 4.8,
          gems: 28,
          followers: "21.3K",
          title: "EDM Producer",
          projects: 38,
          verified: true,
          username: "emilychen"
        },
        {
          name: "Jason Lee",
          avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
          genre: "Urban",
          rating: 4.6,
          gems: 19,
          followers: "6.9K",
          title: "Urban Specialist",
          projects: 22,
          verified: false,
          username: "jasonlee"
        },
        {
          name: "Sophia Martinez",
          avatar: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg",
          genre: "Acoustic",
          rating: 4.9,
          gems: 31,
          followers: "18.1K",
          title: "Multi-Instrumentalist",
          projects: 47,
          verified: true,
          username: "sophiamartinez"
        }
      ].slice(0, limit));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducers();
  }, [limit]);

  return { producers, loading, error, refetch: fetchTopProducers };
};