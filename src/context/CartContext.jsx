import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload.items || [], loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], loading: false });

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: 'CLEAR' });
    }
  }, [isAuthenticated]);

  const fetchCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await cartAPI.get();
      dispatch({ type: 'SET_CART', payload: data.cart });
    } catch (_) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1, variant = '') => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const { data } = await cartAPI.add({ productId, quantity, variant });
      dispatch({ type: 'SET_CART', payload: data.cart });
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const { data } = await cartAPI.update(productId, { quantity });
      dispatch({ type: 'SET_CART', payload: data.cart });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update cart');
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    try {
      const { data } = await cartAPI.remove(productId);
      dispatch({ type: 'SET_CART', payload: data.cart });
      toast.success('Removed from cart');
    } catch (_) {
      toast.error('Failed to remove item');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clear();
      dispatch({ type: 'CLEAR' });
    } catch (_) {}
  }, []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      loading: state.loading,
      itemCount,
      subtotal,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
