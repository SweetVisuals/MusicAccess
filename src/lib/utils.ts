import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Profile } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transformProfileFromDB(dbProfile: any): Profile {
  return {
    id: dbProfile.id,
    full_name: dbProfile.full_name || dbProfile.username || 'Unknown User',
    username: dbProfile.username || 'unknown',
    bio: dbProfile.bio || '',
    location: dbProfile.location || null,
    website_url: dbProfile.website_url || null,
    avatarUrl: dbProfile.avatar_url || '/default-avatar.png',
    bannerUrl: dbProfile.banner_url || '/default-banner.jpg',
    professional_title: dbProfile.professional_title || null,
    genres: dbProfile.genres || [],
    instruments: dbProfile.instruments || [],
    yearsOfExperience: null, // Field doesn't exist in profiles table
    rates: {}, // Field doesn't exist in profiles table
    availability: 'available', // Field doesn't exist in profiles table
    accentColor: '#3b82f6', // Field doesn't exist in profiles table
    theme: 'light', // Field doesn't exist in profiles table
    displayLayout: 'grid', // Field doesn't exist in profiles table
    privacySettings: {
      showEmail: false,
      showLocation: false,
      showRates: false,
      showStats: true,
      profileVisibility: 'public'
    }, // Field doesn't exist in profiles table
    createdAt: dbProfile.createdAt,
    updatedAt: dbProfile.updatedAt,
    email: dbProfile.email,
    user_metadata: {
      username: dbProfile.username || 'unknown'
    }
  };
}

export function parseDuration(duration: string | number | undefined): number {
  if (!duration) return 0;

  if (typeof duration === 'number') {
    return duration;
  }

  // Handle string format like "MM:SS"
  if (typeof duration === 'string') {
    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    // If parsing fails, try to parse as a number
    const parsed = parseFloat(duration);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds === 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  }
}
