import useProfile from '@/hooks/useProfile';
import { AlbumCard } from '../music/AlbumCard';

const AlbumsTab = () => {
  const { stats } = useProfile();

  // Sample album data - would normally come from API
  const albums = Array.from({ length: stats.albums }, (_, i) => ({
    id: `album-${i + 1}`,
    title: `Album ${i + 1}`,
    year: 2020 + i,
    trackCount: Math.floor(Math.random() * 15) + 5,
    artworkUrl: 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg',
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};

export default AlbumsTab;
