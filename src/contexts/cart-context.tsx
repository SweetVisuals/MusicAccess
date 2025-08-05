import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  track_id?: string;
  project_id?: string;
  quantity: number;
  title: string;
  price: number;
  type?: string; // Added type
  artworkUrl?: string; // Added artworkUrl
  producer_name?: string;
  producer_avatar_url?: string;
  genre?: string;
  is_saved_for_later: boolean;
  track_count?: number;
}

interface CartContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  addToCart: (entityId: string, entityType: 'track' | 'project') => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  isInCart: (entityId: string, entityType: 'track' | 'project') => boolean;
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
        let { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (cartError && cartError.code === 'PGRST116') {
          const { data: newCart, error: newCartError } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          if (newCartError) throw newCartError;
          cartData = newCart;
        } else if (cartError) {
          throw cartError;
        }

        if (!cartData) throw new Error("Could not get or create a cart for the user.");
        
        const dbCartId = cartData.id;
        setCartId(dbCartId);

        const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]') as CartItem[];
        if (localCartItems.length > 0) {
          const { data: existingDbItems, error: fetchError } = await supabase
            .from('cart_items')
            .select('track_id, project_id')
            .eq('cart_id', dbCartId);

          if (fetchError) throw fetchError;

          const itemsToInsert = localCartItems
            .filter(localItem => 
              !existingDbItems?.some(dbItem =>
                (localItem.track_id && localItem.track_id === dbItem.track_id) ||
                (localItem.project_id && localItem.project_id === dbItem.project_id)
              )
            )
            .map(item => ({
              cart_id: dbCartId,
              track_id: item.track_id,
              project_id: item.project_id,
              quantity: item.quantity,
              is_saved_for_later: item.is_saved_for_later,
            }));

          if (itemsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('cart_items').insert(itemsToInsert);
            if (insertError) {
              console.error('Error merging cart:', insertError);
              toast({ title: "Could not merge local cart", description: "Some items from your guest session could not be saved.", variant: "destructive" });
            }
          }
          localStorage.removeItem('localCart');
        }

        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id, quantity, is_saved_for_later, project_id, track_id,
            projects (id, title, price, genre, profiles (username, avatar_url)),
            tracks (id, title, price, projects (id, profiles (username, avatar_url)))
          `)
          .eq('cart_id', dbCartId);
        
        if (itemsError) throw itemsError;

        if (items) {
          const allItems = await Promise.all(items.map(async (item) => {
            if (item.project_id && item.projects) {
              const projectDetails = Array.isArray(item.projects) ? item.projects[0] : item.projects;
              if (projectDetails) {
                const { count } = await supabase.from('audio_tracks').select('id', { count: 'exact', head: true }).eq('project_id', item.project_id);
                let profile = projectDetails.profiles ? (Array.isArray(projectDetails.profiles) ? projectDetails.profiles[0] : projectDetails.profiles) : null;
                return {
                  id: item.id, project_id: item.project_id, quantity: item.quantity, title: projectDetails.title,
                  price: projectDetails.price, genre: projectDetails.genre, producer_name: profile?.username,
                  producer_avatar_url: profile?.avatar_url, is_saved_for_later: item.is_saved_for_later, track_count: count ?? 0,
                };
              }
            }
            if (item.track_id && item.tracks) {
              const trackDetails = Array.isArray(item.tracks) ? item.tracks[0] : item.tracks;
              if (trackDetails) {
                const project = Array.isArray(trackDetails.projects) ? trackDetails.projects[0] : trackDetails.projects;
                let profile = project?.profiles ? (Array.isArray(project.profiles) ? project.profiles[0] : project.profiles) : null;
                return {
                  id: item.id, track_id: item.track_id, quantity: item.quantity, title: trackDetails.title,
                  price: trackDetails.price, producer_name: profile?.username,
                  producer_avatar_url: profile?.avatar_url, is_saved_for_later: item.is_saved_for_later,
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

  const isInCart = (entityId: string, entityType: 'track' | 'project') => {
    const allItems = [...cart, ...savedForLater];
    if (entityType === 'track') {
      return allItems.some((item) => item.track_id === entityId);
    }
    return allItems.some((item) => item.project_id === entityId);
  };

  const addToCart = async (entityId: string, entityType: 'track' | 'project') => {
    if (isInCart(entityId, entityType)) {
      toast({ title: "Already in Cart", description: "This item is already in your cart.", variant: "default" });
      return;
    }

    setLoading(true);
    try {
      let newItemDetails: Omit<CartItem, 'id' | 'quantity' | 'is_saved_for_later'> & { project_id?: string; track_id?: string };

      if (entityType === 'project') {
        const { data, error } = await supabase.from('projects').select('*, profiles(username, avatar_url)').eq('id', entityId).single();
        if (error || !data) throw error || new Error("Project not found");
        const { count } = await supabase.from('audio_tracks').select('id', { count: 'exact', head: true }).eq('project_id', entityId);
        let profile = data.profiles ? (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) : null;
        newItemDetails = {
          project_id: data.id, title: data.title, price: data.price, genre: data.genre,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url, track_count: count ?? 0,
        };
      } else {
        const { data, error } = await supabase.from('tracks').select('*, projects(*, profiles(username, avatar_url))').eq('id', entityId).single();
        if (error || !data) throw error || new Error("Track not found");
        const project = data.projects ? (Array.isArray(data.projects) ? data.projects[0] : data.projects) : null;
        let profile = project?.profiles ? (Array.isArray(project.profiles) ? project.profiles[0] : project.profiles) : null;
        newItemDetails = {
          track_id: data.id, title: data.title, price: data.price,
          producer_name: profile?.username, producer_avatar_url: profile?.avatar_url,
        };
      }

      if (user && cartId) {
        const item = {
          cart_id: cartId, [`${entityType}_id`]: entityId,
          quantity: 1, is_saved_for_later: false,
        };
        const { data: newCartItem, error } = await supabase.from('cart_items').insert(item).select().single();
        if (error) throw error;
        const finalNewItem: CartItem = {
          id: newCartItem.id, quantity: newCartItem.quantity, is_saved_for_later: newCartItem.is_saved_for_later, ...newItemDetails,
        };
        setCart(prev => [...prev, finalNewItem]);
        setRecentlyAddedId(finalNewItem.id);
        setTimeout(() => setRecentlyAddedId(null), 3000);
      } else if (!user) {
        const tempId = `${entityType}-${entityId}-${Date.now()}`;
        const finalNewItem: CartItem = {
          id: tempId, quantity: 1, is_saved_for_later: false, ...newItemDetails,
        };
        const newCart = [...cart, finalNewItem];
        setCart(newCart);
        updateLocalCart(newCart, savedForLater);
        setRecentlyAddedId(finalNewItem.id);
        setTimeout(() => setRecentlyAddedId(null), 3000);
      } else {
        throw new Error("User is logged in but cart is not available.");
      }
    } catch (error) {
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
    <CartContext.Provider value={{ cart, savedForLater, addToCart, removeFromCart, isInCart, loading, clearCart, saveForLater, moveToCart, recentlyAddedId }}>
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
