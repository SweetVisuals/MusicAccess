import { create } from 'zustand';
import { UserProfile, ProfileStats } from '@/lib/types';

interface ProfileStore {
  profile: UserProfile;
  stats: ProfileStats;
  updateProfile: (values: Partial<UserProfile>) => void;
  updateStats: (values: Partial<ProfileStats>) => void;
}

const useProfile = create<ProfileStore>((set) => ({
  profile: {
    id: '1',
    name: 'Alex Johnson',
    username: '@alexj',
    bio: 'Professional vocalist with 10+ years experience. Specializing in jazz and R&B.',
    location: 'New York, NY',
    website: 'https://alexjohnson.com',
    avatarUrl: '',
    bannerUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  stats: {
    streams: 12540,
    followers: 842,
    gems: 42,
    tracks: 24,
    playlists: 8,
    albums: 3,
  },
  updateProfile: (values) => set((state) => ({
    profile: { ...state.profile, ...values, updatedAt: new Date().toISOString() }
  })),
  updateStats: (values) => set((state) => ({
    stats: { ...state.stats, ...values }
  })),
}));

export default useProfile;
