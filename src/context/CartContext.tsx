'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  image: string;
  price: number;
  platform: string;
  quantity: number;
  isDigital?: boolean;
  variant?: string;
  details?: string[];
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  promoCode: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[]; promoCode: string | null } }
  | { type: 'APPLY_PROMO'; payload: string }
  | { type: 'CLEAR_PROMO' };

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => void;
  clearPromo: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        return { ...state, items: updatedItems, total, itemCount };
      }

      const newItems = [...state.items, { ...action.payload, quantity: 1 }];
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: newItems, total, itemCount };
    }

    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      const total = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: filteredItems, total, itemCount };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }

      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return { ...state, items: updatedItems, total, itemCount };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0, promoCode: null };

    case 'LOAD_CART': {
      const total = action.payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = action.payload.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: action.payload.items,
        total,
        itemCount,
        promoCode: action.payload.promoCode,
      };
    }

    case 'APPLY_PROMO':
      return { ...state, promoCode: action.payload };

    case 'CLEAR_PROMO':
      return { ...state, promoCode: null };

    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
    promoCode: null,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('gamestop-kenya-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const payload = Array.isArray(parsedCart)
          ? { items: parsedCart, promoCode: null }
          : {
              items: Array.isArray(parsedCart?.items) ? parsedCart.items : [],
              promoCode: typeof parsedCart?.promoCode === 'string' ? parsedCart.promoCode : null,
            };

        dispatch({ type: 'LOAD_CART', payload });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      'gamestop-kenya-cart',
      JSON.stringify({ items: state.items, promoCode: state.promoCode })
    );
  }, [state.items, state.promoCode]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyPromo = (code: string) => {
    dispatch({ type: 'APPLY_PROMO', payload: code });
  };

  const clearPromo = () => {
    dispatch({ type: 'CLEAR_PROMO' });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyPromo,
        clearPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
