export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  location?: string;
  website?: string;
  avatarUrl: string;
  bannerUrl: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
  links?: string[];
  tags?: string[];
  defaultTab?: string;
  disabledTabs?: string[];
  tabOrder?: string[];
  // Professional Info
  professionalTitle?: string;
  genres?: string[];
  instruments?: string[];
  yearsOfExperience?: number;
  rates?: {
    hourly?: number;
    project?: number;
  };
  availability?: 'available' | 'busy' | 'not_available';
  // Social Media
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  // Appearance
  accentColor?: string;
  theme?: 'light' | 'dark' | 'system';
  displayLayout?: 'grid' | 'list';
  // Privacy
  privacySettings?: {
    showEmail: boolean;
    showLocation: boolean;
    showRates: boolean;
    showStats: boolean;
    profileVisibility: 'public' | 'private' | 'connections_only';
  };
}

export interface ProfileStats {
  streams: number;
  followers: number;
  gems: number;
  tracks: number;
  playlists: number;
  albums: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'audio' | 'image' | 'video';
  size?: string;
  modified?: string;
  icon?: React.ReactNode;
  children?: FileItem[];
  pinned?: boolean;
  starred?: boolean;
  tags?: string[];
  badge?: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    color?: string;
  };
}
