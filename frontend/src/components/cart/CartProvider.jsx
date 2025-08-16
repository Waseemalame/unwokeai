import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const KEY = 'bf_cart_v1';

function load() { try { return JSON.parse(localStorage.getItem(KEY)) ?? { items: [] }; } catch { return { items: [] }; } }
function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { trackId, title, priceCents, license = 'mp3' } = action.payload;
      // de-dup by trackId + license
      const idx = state.items.findIndex(i => i.trackId === trackId && i.license === license);
      const items = [...state.items];
      if (idx >= 0) items[idx] = { ...items[idx] }; else items.push({ trackId, title, priceCents, license });
      const next = { items };
      save(next);
      return next;
    }
    case 'REMOVE': {
      const items = state.items.filter(i => !(i.trackId === action.trackId && i.license === action.license));
      const next = { items };
      save(next);
      return next;
    }
    case 'CLEAR': {
      const next = { items: [] };
      save(next);
      return next;
    }
    default: return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  // cross-tab sync
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) window.location.reload(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const totalCents = useMemo(() => state.items.reduce((s, i) => s + (i.priceCents ?? 0), 0), [state.items]);
  const value = useMemo(() => ({
    items: state.items,
    totalCents,
    add: (payload) => dispatch({ type: 'ADD', payload }),
    remove: (trackId, license='mp3') => dispatch({ type: 'REMOVE', trackId, license }),
    clear: () => dispatch({ type: 'CLEAR' }),
  }), [state.items, totalCents]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { return useContext(CartContext); }
