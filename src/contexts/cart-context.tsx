import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/lib/types';

interface CartContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  addToCart: (entityId: string, entityType: 'track' | 'project' | 'service' | 'playlist', quantity?: number, selectedFileTypes?: string[]) => Promise<void>;
  addTrackToCart: (trackData: { id: string; title: string; price: number; producer_name?: string; producer_avatar_url?: string; quantity?: number; selected_file_types?: string[] }) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  isInCart: (entityId: string, entityType: 'track' | 'project' | 'service' | 'playlist') => boolean;
  loading: boolean;
  clearCart: () => void;
  saveForLater: (itemId: string) => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  recentlyAddedId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const updateLocalCart = (newCart: CartItem[], newSaved: CartItem[]) => {
    if (user) return; 
    const allItems = [...newCart, ...newSaved];
    if (allItems.length > 0) {
      const storableItems = allItems.filter(item => item.project_id || item.track_id);
      localStorage.setItem('localCart', JSON.stringify(storableItems));
    } else {
      localStorage.removeItem('localCart');
    }
  };

  useEffect(() => {
    const loadGuestCart = () => {
      setLoading(true);
      try {
        const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
        const validItems = localCartItems.filter(Boolean) as CartItem[];
        setCart(validItems.filter(item => !item.is_saved_for_later));
        setSavedForLater(validItems.filter(item => item.is_saved_for_later));
      } catch (error) {
        console.error("Error loading guest cart from localStorage:", error);
        setCart([]);
        setSavedForLater([]);
      } finally {
        setCartId(null);
        setLoading(false);
      }
    };

    const syncAndFetchUserCart = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // First check if user is authenticated by getting the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No active session, skipping cart sync');
          setLoading(false);
          return;
        }

        let cartData = null;
        try {
          const { data, error } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) // Get the latest cart
            .limit(1)
            .single(); // Use single to get one
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          cartData = data;
        } catch (error) {
          console.error('Error fetching cart:', error);
          // Try to get all carts and use the first
          try {
            const { data: carts, error: fetchError } = await supabase
              .from('carts')
              .select('id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (fetchError) throw fetchError;
            if (carts && carts.length > 0) {
              cartData = carts[0];
            }
          } catch (fetchError) {
            console.error('Error fetching carts:', fetchError);
            toast({ title: "Error", description: "Could not access your cart.", variant: "destructive" });
            setLoading(false);
            return;
          }
        }

        if (!cartData) {
          // Create new cart
          try {
            const { data: newCart, error: newCartError } = await supabase
              .from('carts')
              .insert({ user_id: user.id })
              .select('id')
              .single();
            if (newCartError) throw newCartError;
            cartData = newCart;
          } catch (newCartError) {
            console.error('Error creating cart:', newCartError);
            toast({ title: "Error", description: "Could not create a cart for your account.", variant: "destructive" });
            setLoading(false);
            return;
          }
        }
        
        const dbCartId = cartData.id;
        setCartId(dbCartId);

        const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]') as CartItem[];
        if (localCartItems.length > 0) {
          let query = supabase
            .from('cart_items')
            .select('track_id, project_id, service_id')
            .eq('cart_id', dbCartId);
  
          const { data: existingDbItems, error: fetchError } = await query;

          if (fetchError) throw fetchError;

          const itemsToInsert = localCartItems
            .filter(localItem =>
              !existingDbItems?.some(dbItem =>
                (localItem.track_id && localItem.track_id === dbItem.track_id) ||
                (localItem.project_id && localItem.project_id === dbItem.project_id) ||
                (localItem.service_id && localItem.service_id === dbItem.service_id)
              )
            )
            .map(item => ({
              cart_id: dbCartId,
              track_id: item.track_id,
              project_id: item.project_id,
              service_id: item.service_id,
              quantity: item.quantity,
              is_saved_for_later: item.is_saved_for_later,
              selected_file_types: item.selected_file_types,
            }));

          if (itemsToInsert.length > 0) {
            const errors: any[] = [];
            
            for (const item of itemsToInsert) {
              try {
                // Skip insertion if item already exists (avoid 409)
                let query = supabase
                  .from('cart_items')
                  .select('id')
                  .eq('cart_id', item.cart_id);
      
                if (item.track_id) query = query.eq('track_id', item.track_id);
                if (item.project_id) query = query.eq('project_id', item.project_id);
                if (item.service_id) query = query.eq('service_id', item.service_id);
      
                const { data: existingItem } = await query.maybeSingle();
      
                if (!existingItem) {
                  const { error } = await supabase.from('cart_items').insert(item);
                  if (error) {
                    if (error.code === '23505') {
                      // Unique constraint violation, skip duplicate
                      continue;
                    }
                    errors.push(error);
                  }
                }
              } catch (error) {
                errors.push(error);
              }
            }

            if (errors.length > 0) {
              console.error('Error merging cart:', errors);
              toast({ title: "Could not merge local cart", description: "Some items from your guest session could not be saved.", variant: "destructive" });
            }
          }
          localStorage.removeItem('localCart');
        }

        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id, quantity, is_saved_for_later, project_id, track_id, playlist_id, selected_file_types,
            projects (id, title, price, genre, profiles (username, avatar_url)),
            audio_tracks (id, title, price, projects (id, profiles (username, avatar_url))),
            playlists (id, title, price, cover_art_url, profiles (username, avatar_url))
          `)
          .eq('cart_id', dbCartId);
        
        if (itemsError) throw itemsError;

        if (items) {
          const allItems = await Promise.all(items.map(async (item) => {
            if (item.project_id && item.projects) {
              const projectDetails = Array.isArray(item.projects) ? item.projects[0] : item.projects;
              if (projectDetails) {
                const { data: tracks } = await supabase.from('audio_tracks').select('title').eq('project_id', item.project_id);
                const uniqueTitles = new Set(tracks?.map(t => t.title) || []);
                const count = uniqueTitles.size;
                let profile = projectDetails.profiles ? (Array.isArray(projectDetails.profiles) ? projectDetails.profiles[0] : projectDetails.profiles) : null;
                return {
                  id: item.id, project_id: item.project_id, quantity: item.quantity, title: projectDetails.title,
                  price: projectDetails.price, genre: projectDetails.genre, producer_name: profile?.username,
                  producer_avatar_url: profile?.avatar_url, is_saved_for_later: item.is_saved_for_later, track_count: count ?? 0,
                };
              }
            }
            if (item.track_id && item.audio_tracks) {
              const trackDetails = Array.isArray(item.audio_tracks) ? item.audio_tracks[0] : item.audio_tracks;
              if (trackDetails) {
                const project = Array.isArray(trackDetails.projects) ? trackDetails.projects[0] : trackDetails.projects;
                let profile = project?.profiles ? (Array.isArray(project.profiles) ? project.profiles[0] : project.profiles) : null;
                return {
                  id: item.id, track_id: item.track_id, quantity: item.quantity, title: trackDetails.title,
                  price: trackDetails.price, producer_name: profile?.username,
                  producer_avatar_url: profile?.avatar_url, is_saved_for_later: item.is_saved_for_later,
                  selected_file_types: item.selected_file_types,
                };
              }
            }
            if (item.playlist_id && item.playlists) {
              const playlistDetails = Array.isArray(item.playlists) ? item.playlists[0] : item.playlists;
              if (playlistDetails) {
                // Get track count for the playlist
                const { data: playlistTracks } = await supabase
                  .from('playlist_tracks')
                  .select('track_id')
                  .eq('playlist_id', item.playlist_id);
                const trackCount = playlistTracks?.length || 0;
                
                let profile = playlistDetails.profiles ? (Array.isArray(playlistDetails.profiles) ? playlistDetails.profiles[0] : playlistDetails.profiles) : null;
                return {
                  id: item.id, playlist_id: item.playlist_id, quantity: item.quantity, title: playlistDetails.title,
                  price: playlistDetails.price, producer_name: profile?.username,
                  producer_avatar_url: profile?.avatar_url, is_saved_for_later: item.is_saved_for_later,
                  track_count: trackCount,
                };
              }
            }
            return null;
          }));
          const validItems = allItems.filter(Boolean) as CartItem[];
          setCart(validItems.filter(item => !item.is_saved_for_later));
          setSavedForLater(validItems.filter(item => item.is_saved_for_later));
        } else {
          setCart([]);
          setSavedForLater([]);
        }
      } catch (error) {
        console.error('Error syncing/fetching user cart:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      syncAndFetchUserCart();
    } else {
      loadGuestCart();
    }
  }, [user, toast]);

  const isInCart = (entityId: string, entityType: 'track' | 'project' | 'service' | 'playlist') => {
    const allItems = [...cart, ...savedForLater];
    if (entityType === 'track') {
      return allItems.some((item) => item.track_id === entityId);
    }
    if (entityType === 'project') {
      return allItems.some((item) => item.project_id === entityId);
    }
    if (entityType === 'service') {
      return allItems.some((item) => item.service_id === entityId);
    }
    if (entityType === 'playlist') {
      return allItems.some((item) => item.playlist_id === entityId);
    }
    return false;
  };

  const addTrackToCart = async (trackData: { id: string; title: string; price: number; producer_name?: string; producer_avatar_url?: string; quantity?: number; selected_file_types?: string[] }) => {
    if (isInCart(trackData.id, 'track')) {
      toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
      return;
    }

    setLoading(true);
    try {
      // Ensure track exists in audio_tracks before adding to cart
      const { data: existingTrack } = await supabase
        .from('audio_tracks')
        .select('id')
        .eq('id', trackData.id)
        .maybeSingle();

      if (!existingTrack) {
        // Try to find track in project_files and create it in audio_tracks
        const { data: projectFileData, error: projectFileError } = await supabase
          .from('project_files')
          .select('*')
          .eq('id', trackData.id)
          .maybeSingle();

        if (projectFileData && !projectFileError) {
          // Get file data separately to avoid RLS issues
          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', projectFileData.file_id)
            .maybeSingle();

          if (fileData && !fileError && fileData.file_url) {
            // Create the track in audio_tracks first
            const trackInsertData = {
              id: trackData.id,
              project_id: projectFileData.project_id,
              title: fileData.name || trackData.title || 'Untitled Track',
              audio_url: fileData.file_url,
              price: projectFileData.price || trackData.price || 0,
              allow_download: projectFileData.allow_downloads,
              user_id: user?.id, // Use authenticated user's ID
              duration_seconds: 0 // files table doesn't have duration
            };

            console.log('Creating track in audio_tracks:', trackInsertData);

            const { error: createError } = await supabase
              .from('audio_tracks')
              .insert(trackInsertData);

            if (createError) {
              console.error('Error creating track in audio_tracks:', createError);
              throw new Error(`Failed to create track record: ${createError.message}`);
            }

            console.log('Successfully created track in audio_tracks');
          } else {
            throw new Error("File data not found or not accessible");
          }
        } else {
          throw new Error("Track not found in project_files");
        }
      }

      const newItemDetails = {
        type: 'track' as const,
        track_id: trackData.id,
        title: trackData.title,
        price: trackData.price,
        producer_name: trackData.producer_name,
        producer_avatar_url: trackData.producer_avatar_url,
        selected_file_types: trackData.selected_file_types,
      };

      if (user && cartId) {
        const item = {
          cart_id: cartId,
          track_id: trackData.id,
          quantity: 1,
          is_saved_for_later: false,
        };

        try {
          const { data: newCartItem, error } = await supabase.from('cart_items').insert(item).select().single();
          if (error) {
            if (error.code === '23505') {
              // Unique constraint violation, item already exists
              toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
              return;
            }
            if (error.code === '23503') {
              // Foreign key constraint violation, track doesn't exist
              toast({ title: "Track not found", description: "This track is not available.", variant: "destructive" });
              return;
            }
            throw error;
          }
          const finalNewItem: CartItem = {
            id: newCartItem.id,
            quantity: newCartItem.quantity,
            is_saved_for_later: newCartItem.is_saved_for_later,
            ...newItemDetails,
          };
          setCart(prev => [...prev, finalNewItem]);
          setRecentlyAddedId(finalNewItem.id);
          setTimeout(() => setRecentlyAddedId(null), 3000);
        } catch (error: any) {
          if (error.code === '23505') {
            // Unique constraint violation, item already exists
            toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
            return;
          }
          if (error.code === '23503') {
            // Foreign key constraint violation, track doesn't exist
            toast({ title: "Track not found", description: "This track is not available.", variant: "destructive" });
            return;
          }
          console.error('Error adding track to cart:', error);
          toast({ title: "Error", description: "Failed to add track to cart.", variant: "destructive" });
          return;
        }
      } else if (!user) {
        const tempId = `track-${trackData.id}-${Date.now()}`;
        const finalNewItem: CartItem = {
          id: tempId,
          quantity: 1,
          is_saved_for_later: false,
          ...newItemDetails,
        };
        const newCart = [...cart, finalNewItem];
        setCart(newCart);
        updateLocalCart(newCart, savedForLater);
        setRecentlyAddedId(finalNewItem.id);
        setTimeout(() => setRecentlyAddedId(null), 3000);
      } else {
        throw new Error("User is logged in but cart is not available.");
      }
    } catch (error: any) {
      console.error('Error adding track to cart:', error);
      toast({ title: "Error", description: "Failed to add track to cart.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (entityId: string, entityType: 'track' | 'project' | 'service' | 'playlist', quantity: number = 1, selectedFileTypes?: string[]) => {
    if (isInCart(entityId, entityType)) {
      toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
      return;
    }

    // For projects, check if any individual tracks from this project are already in cart
    if (entityType === 'project') {
      // Fetch all tracks for this project
      const { data: projectTracks } = await supabase
        .from('audio_tracks')
        .select('id')
        .eq('project_id', entityId);

      if (projectTracks && projectTracks.length > 0) {
        const trackIds = projectTracks.map(track => track.id);
        const allItems = [...cart, ...savedForLater];
        const tracksInCart = allItems.filter(item =>
          item.type === 'track' && trackIds.includes(item.track_id!)
        );
    
        // Remove individual tracks from the same project
        if (tracksInCart.length > 0) {
          for (const trackItem of tracksInCart) {
            await removeFromCart(trackItem.id);
          }
          toast({
            title: "Project Added",
            description: `Added project and removed ${tracksInCart.length} individual track${tracksInCart.length !== 1 ? 's' : ''} from the same project.`,
            variant: "default"
          });
        }
      }
    }

    // For tracks, check if parent project is already in cart
    if (entityType === 'track') {
      try {
        const { data: trackData } = await supabase
          .from('audio_tracks')
          .select('project_id')
          .eq('id', entityId)
          .maybeSingle();

        if (trackData && trackData.project_id && isInCart(trackData.project_id, 'project')) {
          toast({
            title: "Project in Cart",
            description: "The entire project is already in your cart.",
            variant: "default"
          });
          return;
        }
      } catch (error) {
        console.error('Error checking track project:', error);
        // Skip the check if can't fetch
      }
    }

    setLoading(true);
    try {
      let newItemDetails: Omit<CartItem, 'id' | 'quantity' | 'is_saved_for_later'> & { project_id?: string; track_id?: string; service_id?: string } | undefined;

      if (entityType === 'project') {
        const { data, error } = await supabase.from('projects').select('*, profiles(username, avatar_url)').eq('id', entityId).maybeSingle();
        if (error || !data) throw error || new Error("Project not found");
        const { data: tracks } = await supabase.from('audio_tracks').select('title').eq('project_id', entityId);
        const uniqueTitles = new Set(tracks?.map(t => t.title) || []);
        const count = uniqueTitles.size;
        let profile = data.profiles ? (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) : null;
        newItemDetails = {
          type: 'project',
          project_id: data.id, title: data.title, price: data.price, genre: data.genre,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url, track_count: count ?? 0,
        };
      } else if (entityType === 'track') {
        // First try to get track from audio_tracks table
        let trackData = null;
        let projectData = null;
        let calculatedPrice = 0;

        const { data: audioTrackData, error: audioTrackError } = await supabase
          .from('audio_tracks')
          .select('*, projects(*, profiles(username, avatar_url))')
          .eq('id', entityId)
          .maybeSingle();

        if (audioTrackData && !audioTrackError) {
          trackData = audioTrackData;
          projectData = Array.isArray(trackData.projects) ? trackData.projects[0] : trackData.projects;
          calculatedPrice = trackData.price || 0;
        } else {
          // If not found in audio_tracks, try to get from project_files (new structure)
          const { data: projectFileData, error: projectFileError } = await supabase
            .from('project_files')
            .select('*')
            .eq('id', entityId)
            .maybeSingle();

          if (projectFileData && !projectFileError) {
            // Get file data separately to avoid RLS issues
            const { data: fileData, error: fileError } = await supabase
              .from('files')
              .select('*')
              .eq('id', projectFileData.file_id)
              .maybeSingle();

            if (fileData && !fileError && fileData.file_url) {
              // Get project data separately
              const { data: projectInfo, error: projectError } = await supabase
                .from('projects')
                .select('*, profiles(username, avatar_url)')
                .eq('id', projectFileData.project_id)
                .maybeSingle();

              // Check if this track exists in audio_tracks, if not, create it
              const existingAudioTrack = await supabase
                .from('audio_tracks')
                .select('id')
                .eq('id', fileData.id || projectFileData.id)
                .maybeSingle();

              if (!existingAudioTrack.data) {
                // Create the track in audio_tracks first
                const trackInsertData = {
                  id: entityId,
                  project_id: projectFileData.project_id,
                  title: fileData.name || 'Untitled Track',
                  audio_url: fileData.file_url,
                  price: projectFileData.price || 0,
                  allow_download: projectFileData.allow_downloads,
                  user_id: user?.id, // Use authenticated user's ID
                  duration_seconds: 0 // files table doesn't have duration
                };

                console.log('Creating track in audio_tracks:', trackInsertData);

                const { error: createError } = await supabase
                  .from('audio_tracks')
                  .insert(trackInsertData);

                if (createError) {
                  console.error('Error creating track in audio_tracks:', createError);
                  throw new Error(`Failed to create track record: ${createError.message}`);
                }

                console.log('Successfully created track in audio_tracks');
              }

              trackData = {
                ...fileData,
                id: fileData.id || projectFileData.id,
                title: fileData.name,
                audio_url: fileData.file_url,
                price: projectFileData.price,
                allow_download: projectFileData.allow_downloads
              };
              projectData = projectInfo;
              calculatedPrice = projectFileData.price || 0;
            }
          }
        }

        if (!trackData) throw new Error("Track not found");

        // Calculate price based on selected file types if provided
        if (selectedFileTypes && selectedFileTypes.length > 0) {
          // Fetch project files to get prices for selected file types
          const { data: projectFiles, error: filesError } = await supabase
            .from('project_files')
            .select('price, files(file_path, name)')
            .eq('project_id', projectData?.id);

          if (!filesError && projectFiles) {
            calculatedPrice = 0;
            selectedFileTypes.forEach(fileType => {
              // Find matching project file based on file type
              const matchingFile = projectFiles.find(pf => {
                const fileObj = Array.isArray(pf.files) ? pf.files[0] : pf.files;
                const fileName = fileObj?.file_path || fileObj?.name || '';
                const extension = fileName.split('.').pop()?.toLowerCase();
                const isStem = fileName.toLowerCase().includes('stem') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '');
                const isWav = extension === 'wav' || extension === 'wave';
                const isMp3 = extension === 'mp3';

                if (fileType === 'mp3' && isMp3) return true;
                if (fileType === 'wav' && isWav) return true;
                if (fileType === 'stems' && isStem) return true;
                return false;
              });

              if (matchingFile && matchingFile.price) {
                calculatedPrice += matchingFile.price;
              }
            });
          }
        }

        let profile = projectData?.profiles ? (Array.isArray(projectData.profiles) ? projectData.profiles[0] : projectData.profiles) : null;
        newItemDetails = {
          type: 'track',
          track_id: trackData.id, project_id: projectData?.id, title: trackData.title || 'Untitled Track', price: calculatedPrice,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url,
          selected_file_types: selectedFileTypes,
        };
      } else if (entityType === 'service') {
        const { data, error } = await supabase.from('services').select('*, profiles(username, avatar_url)').eq('id', entityId).maybeSingle();
        if (error || !data) throw error || new Error("Service not found");
        let profile = data.profiles ? (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) : null;
        newItemDetails = {
          type: 'service',
          service_id: data.id, title: data.title, price: data.price,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url,
        };
      } else if (entityType === 'playlist') {
        const { data, error } = await supabase.from('playlists').select('*, profiles(username, avatar_url)').eq('id', entityId).maybeSingle();
        if (error || !data) throw error || new Error("Playlist not found");
        
        // Get track count for the playlist
        const { data: playlistTracks } = await supabase
          .from('playlist_tracks')
          .select('track_id')
          .eq('playlist_id', entityId);
        const trackCount = playlistTracks?.length || 0;
        
        let profile = data.profiles ? (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) : null;
        newItemDetails = {
          type: 'playlist',
          playlist_id: data.id, title: data.title, price: data.price,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url,
          track_count: trackCount,
        };
      }

      if (user && cartId) {
        const item = {
          cart_id: cartId,
          ...(entityType === 'track' && { track_id: entityId }),
          ...(entityType === 'project' && { project_id: entityId }),
          ...(entityType === 'service' && { service_id: entityId }),
          ...(entityType === 'playlist' && { playlist_id: entityId }),
          quantity: quantity, is_saved_for_later: false,
          ...(entityType === 'track' && selectedFileTypes && { selected_file_types: selectedFileTypes }),
        };

        try {
          // Check if item already exists in cart (any status)
          let query = supabase
            .from('cart_items')
            .select('id')
            .eq('cart_id', cartId);
  
          if (item.track_id) query = query.eq('track_id', item.track_id);
          if (item.project_id) query = query.eq('project_id', item.project_id);
          if (item.service_id) query = query.eq('service_id', item.service_id);
          if (item.playlist_id) query = query.eq('playlist_id', item.playlist_id);

          const { data: existingItem } = await query.maybeSingle();

          if (existingItem) {
            toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
            return;
          }

          const { data: newCartItem, error } = await supabase.from('cart_items').insert(item).select().single();
          if (error) {
            if (error.code === '23505') {
              // Unique constraint violation, item already exists
              toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
              return;
            }
            if (error.code === '23503') {
              // Foreign key constraint violation, entity doesn't exist
              toast({ title: "Item not found", description: "This item is not available.", variant: "destructive" });
              return;
            }
            throw error;
          }
          const finalNewItem: CartItem = {
            id: newCartItem.id, quantity: newCartItem.quantity, is_saved_for_later: newCartItem.is_saved_for_later,
            ...newItemDetails!,
          };
          setCart(prev => [...prev, finalNewItem]);
          setRecentlyAddedId(finalNewItem.id);
          setTimeout(() => setRecentlyAddedId(null), 3000);
        } catch (error: any) {
          if (error.code === '23505') {
            // Unique constraint violation, item already exists
            toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
            return;
          }
          if (error.code === '23503') {
            // Foreign key constraint violation, entity doesn't exist
            toast({ title: "Item not found", description: "This item is not available.", variant: "destructive" });
            return;
          }
          console.error('Error adding to cart:', error);
          toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" });
          return;
        }
      } else if (!user) {
        const tempId = `${entityType}-${entityId}-${Date.now()}`;
        const finalNewItem: CartItem = {
          id: tempId, quantity: quantity, is_saved_for_later: false,
          ...newItemDetails!,
        };
        const newCart = [...cart, finalNewItem];
        setCart(newCart);
        updateLocalCart(newCart, savedForLater);
        setRecentlyAddedId(finalNewItem.id);
        setTimeout(() => setRecentlyAddedId(null), 3000);
      } else {
        throw new Error("User is logged in but cart is not available.");
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    const itemInCart = cart.find(item => item.id === itemId);
    const itemInSaved = savedForLater.find(item => item.id === itemId);

    const newCart = cart.filter(item => item.id !== itemId);
    const newSaved = savedForLater.filter(item => item.id !== itemId);
    
    setCart(newCart);
    setSavedForLater(newSaved);

    if (user && cartId) {
      try {
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (error) {
          if (itemInCart) setCart(prev => [...prev, itemInCart]);
          if (itemInSaved) setSavedForLater(prev => [...prev, itemInSaved]);
          toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
          throw error;
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    } else if (!user) {
      updateLocalCart(newCart, newSaved);
    }
  };

  const saveForLater = async (itemId: string) => {
    const itemToSave = cart.find(item => item.id === itemId);
    if (!itemToSave) return;

    const newCart = cart.filter(item => item.id !== itemId);
    const newSaved = [...savedForLater, { ...itemToSave, is_saved_for_later: true }];

    setCart(newCart);
    setSavedForLater(newSaved);

    if (user && cartId) {
      try {
        const { error } = await supabase.from('cart_items').update({ is_saved_for_later: true }).eq('id', itemId);
        if (error) {
          setCart(cart); // Revert optimistic update
          setSavedForLater(savedForLater);
          toast({ title: "Error", description: "Failed to save item for later.", variant: "destructive" });
          throw error;
        }
      } catch (error) {
        console.error('Error saving for later:', error);
      }
    } else if (!user) {
      updateLocalCart(newCart, newSaved);
    }
  };

  const moveToCart = async (itemId: string) => {
    const itemToMove = savedForLater.find(item => item.id === itemId);
    if (!itemToMove) return;

    const newSaved = savedForLater.filter(item => item.id !== itemId);
    const newCart = [...cart, { ...itemToMove, is_saved_for_later: false }];

    setSavedForLater(newSaved);
    setCart(newCart);

    if (user && cartId) {
      try {
        const { error } = await supabase.from('cart_items').update({ is_saved_for_later: false }).eq('id', itemId);
        if (error) {
          setSavedForLater(savedForLater); // Revert optimistic update
          setCart(cart);
          toast({ title: "Error", description: "Failed to move item to cart.", variant: "destructive" });
          throw error;
        }
      } catch (error) {
        console.error('Error moving to cart:', error);
      }
    } else if (!user) {
      updateLocalCart(newCart, newSaved);
    }
  };

  const clearCart = async () => {
    if (user && cartId) {
      const previousCart = [...cart];
      setCart([]);
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .eq('is_saved_for_later', false);

        if (error) {
          setCart(previousCart);
          toast({ title: "Error", description: "Failed to clear cart.", variant: "destructive" });
          throw error;
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else if (!user) {
      setCart([]);
      updateLocalCart([], savedForLater);
    }
  };

  return (
    <CartContext.Provider value={{ cart, savedForLater, addToCart, addTrackToCart, removeFromCart, isInCart, loading, clearCart, saveForLater, moveToCart, recentlyAddedId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
