import useProfile from '@/hooks/useProfile';
import { PlaylistCard } from '../music/PlaylistCard';

const PlaylistsTab = () => {
  const { stats } = useProfile();

  // Sample playlist data - would normally come from API
  const playlists = Array.from({ length: stats.playlists }, (_, i) => ({
    id: `playlist-${i + 1}`,
    title: `Playlist ${i + 1}`,
    trackCount: Math.floor(Math.random() * 20) + 5,
    duration: `${Math.floor(Math.random() * 2) + 1}h ${Math.floor(Math.random() * 60)}m`,
    artworkUrl: 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg',
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
};

export default PlaylistsTab;
