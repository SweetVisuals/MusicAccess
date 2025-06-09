import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';

interface CartItem {
  id: string;
  track_id?: string;
  project_id?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (entityId: string, entityType: 'track' | 'project') => void;
  removeFromCart: (itemId: string) => void;
  isInCart: (entityId: string, entityType: 'track' | 'project') => boolean;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getCart();
    } else {
      setCart([]);
      setLoading(false);
    }
  }, [user]);

  const getCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (cartError && cartError.code === 'PGRST116') {
        // No cart exists, create one
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

      if (cartData) {
        setCartId(cartData.id);
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);
        if (itemsError) throw itemsError;
        setCart(items || []);
      }
    } catch (error) {
      console.error('Error getting cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (entityId: string, entityType: 'track' | 'project') => {
    if (entityType === 'track') {
      return cart.some((item) => item.track_id === entityId);
    }
    return cart.some((item) => item.project_id === entityId);
  };

  const addToCart = async (entityId: string, entityType: 'track' | 'project') => {
    if (!cartId) return;
    try {
      const item = {
        cart_id: cartId,
        [`${entityType}_id`]: entityId,
      };

      const { data, error } = await supabase
        .from('cart_items')
        .insert(item)
        .select();

      if (error) throw error;
      setCart([...cart, ...data]);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
      setCart(cart.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, isInCart, loading }}>
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
