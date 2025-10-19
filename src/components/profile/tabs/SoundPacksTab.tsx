import { useState, useEffect } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import SoundPackCard from '../music/SoundPackCard';
import { Button } from '@/components/@/ui/button';
import { Plus, Music } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/@/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFiles } from '@/hooks/useFiles';
import { FileItem, Profile } from '@/lib/types';
import { Checkbox } from '@/components/@/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface SoundPacksTabProps {
  user: Profile;
  isPreviewMode?: boolean;
  viewMode?: 'grid' | 'list';
}

const SoundPacksTab = ({ user, isPreviewMode = false, viewMode = 'grid' }: SoundPacksTabProps) => {
  const { user: currentUser } = useAuth();
  const { addToCart } = useCart();
  const userId = user?.id;
  const isOwner = (currentUser?.id === userId) && !isPreviewMode;
  const { playlists, loading, error, fetchPlaylists } = usePlaylists(userId || '');
  const { files, loading: filesLoading, fetchFiles } = useFiles(userId || '');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    price: 0,
    allowDownloads: false
  });
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);

  // Filter audio files only
  useEffect(() => {
    if (files) {
      setAvailableFiles(files.filter(file => file.type === 'audio'));
    }
  }, [files]);

  // Fetch files when component mounts
  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId]);

  const handleFileSelect = (file: FileItem) => {
    if (selectedFiles.length >= 10 && !selectedFiles.some(f => f.id === file.id)) {
      toast.error("You can select up to 10 files for a sound pack");
      return;
    }

    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleCreateSoundPack = async () => {
    if (!userId) {
      toast.error("You must be logged in to create a sound pack");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title for your sound pack");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file for your sound pack");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new playlist
      const playlistId = uuidv4();
      const { error: playlistError } = await supabase
        .from('playlists')
        .insert({
          id: playlistId,
          user_id: userId,
          title: formData.title,
          description: formData.description,
          is_public: formData.isPublic,
          price: formData.price > 0 ? formData.price : null,
          allow_downloads: formData.allowDownloads,
          cover_art_url: null // TODO: Add cover image upload functionality
        });

      if (playlistError) throw playlistError;

      // Add tracks to the playlist
      const playlistTracks = selectedFiles.map((file, index) => ({
        playlist_id: playlistId,
        track_id: file.id,
        position: index
      }));

      const { error: tracksError } = await supabase
        .from('playlist_tracks')
        .insert(playlistTracks);

      if (tracksError) throw tracksError;

      toast.success("Sound pack created successfully!");
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', isPublic: false, price: 0, allowDownloads: false });
      setSelectedFiles([]);
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating sound pack:', error);
      toast.error("Failed to create sound pack");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) return <div className="p-4">User not found.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading sound packs...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sound Packs</h2>
      </div>

      {playlists.length === 0 ? (
        isOwner ? (
          <div
            className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-center min-h-[200px]"
            onClick={() => setShowCreateDialog(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                <h3 className="text-lg font-medium">Create your first sound pack</h3>
                <p className="text-muted-foreground mt-2">Click to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sound packs found</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              No sound packs found
            </p>
          </div>
        )
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          {isOwner && (
            <div
              className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="sr-only">Create new sound pack</span>
            </div>
          )}
          {playlists.map((playlist) => {
            // Map DB fields to SoundPackCard props with fallbacks
            const mappedSoundPack = {
              id: playlist.id,
              title: playlist.title || 'Untitled Sound Pack',
              trackCount: 0, // Will be calculated from playlist_tracks
              artworkUrl: playlist.cover_art_url || '',
              user_id: playlist.user_id,
              creator_username: user.username,
              price: playlist.price,
              allow_downloads: playlist.allow_downloads,
              contract_url: playlist.contract_url,
              profiles: {
                full_name: user.full_name,
                username: user.username,
                avatarUrl: user.avatarUrl,
                professional_title: user.professional_title ?? undefined
              },
              // Note: tracks will be fetched by SoundPackCard
            };
            return (
              <SoundPackCard
                key={playlist.id}
                soundPack={mappedSoundPack}
                id={playlist.id}
                onAddToCart={async (entityId: string, entityType: 'playlist') => {
                  try {
                    await addToCart(entityId, entityType);
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                    throw error;
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Create Sound Pack Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Sound Pack</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Sound Pack Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter a title for your sound pack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your sound pack"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData({...formData, isPublic: checked as boolean})
                    }
                  />
                  <Label htmlFor="isPublic">Make this sound pack public</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowDownloads"
                    checked={formData.allowDownloads}
                    onCheckedChange={(checked) =>
                      setFormData({...formData, allowDownloads: checked as boolean})
                    }
                  />
                  <Label htmlFor="allowDownloads">Allow downloads</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to 0 for free sound pack, or enter a price to make it buyable
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length}/10)</h3>
                {selectedFiles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No files selected. Select files from the list on the right.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                    {selectedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleFileSelect(file)}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Available Audio Files</h3>
                {filesLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
              </div>

              {availableFiles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No audio files found. Upload some files first.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md h-[350px] overflow-y-auto">
                  {availableFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'border'
                          }`}>
                            {isSelected && <Plus className="h-3 w-3 rotate-45" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-primary" />
                            <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({ title: '', description: '', isPublic: false, price: 0, allowDownloads: false });
                setSelectedFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSoundPack}
              disabled={isSubmitting || !formData.title || selectedFiles.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Sound Pack'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoundPacksTab;
