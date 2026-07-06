import { create } from 'zustand';

export const useStore = create((set, get) => ({
  cart: [],
  orders: [],
  notifications: { new_products: true, promozioni: true, news: true },
  checkoutData: {
    delivery: 'delivery_pavia',
    courier: 'inpost',
    payment: 'crypto',
    address: {},
    notes: '',
    discount: '',
  },

  saveToCloud: async (key, data) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.CloudStorage) return;
      tg.CloudStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  },

  loadFromCloud: (key, defaultValue, setter) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.CloudStorage) return;
      tg.CloudStorage.getItem(key, (err, value) => {
        if (!err && value) {
          try { setter(JSON.parse(value)); } catch {}
        }
      });
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
    }
  },

  loadAllData: () => {
    get().loadFromCloud('cart',          [],                  (data) => set({ cart: data }));
    get().loadFromCloud('orders',        [],                  (data) => set({ orders: data }));
    get().loadFromCloud('notifications', get().notifications, (data) => set({ notifications: data }));
    get().loadFromCloud('checkoutData',  get().checkoutData,  (data) => set({ checkoutData: data }));
  },

  updateCheckoutData: (newData) => {
    set(state => ({ checkoutData: { ...state.checkoutData, ...newData } }));
    get().saveToCloud('checkoutData', get().checkoutData);
  },

  // FIX: store qty under a unified 'qty' key, keep unit info too
  addToCart: (product, qty, strain) => {
    const existing = get().cart.find(
      i => i.productId === product.id && i.strain === strain
    );
    const image = product.media?.find(m => m.type === 'image')?.url
               || product.image
               || '';

    // Detect whether this product uses pcs or grams
    const unit = product.unit ?? 'g';   // 'pz' | 'g' | etc.

    if (existing) {
      set(state => ({
        cart: state.cart.map(i =>
          i.productId === product.id && i.strain === strain
            ? { ...i, qty: i.qty + qty, grams: i.qty + qty }  // keep grams alias for compat
            : i
        ),
      }));
    } else {
      set(state => ({
        cart: [...state.cart, {
          productId: product.id,
          name:      product.name,
          emoji:     product.emoji,
          image,
          qty,
          grams:  qty,   // alias — CartPage reads item.grams for display
          unit,
          strain: strain || null,
          prices: product.prices,
          minQty: product.minQty,
        }],
      }));
    }
    get().saveToCloud('cart', get().cart);
  },

  removeFromCart: (productId, strain) => {
    set(state => ({
      cart: state.cart.filter(
        i => !(i.productId === productId && i.strain === strain)
      ),
    }));
    get().saveToCloud('cart', get().cart);
  },

  // FIX: updateQty now writes both qty and grams so both work
  updateQty: (productId, strain, qty) => {
    set(state => ({
      cart: state.cart.map(i =>
        i.productId === productId && i.strain === strain
          ? { ...i, qty, grams: qty }
          : i
      ),
    }));
    get().saveToCloud('cart', get().cart);
  },

  clearCart: () => {
    set({ cart: [] });
    get().saveToCloud('cart', []);
  },

  addOrder: (order) => {
    set(state => ({ orders: [order, ...state.orders] }));
    get().saveToCloud('orders', get().orders);
  },

  toggleNotification: (id) => {
    set(state => ({
      notifications: { ...state.notifications, [id]: !state.notifications[id] },
    }));
    get().saveToCloud('notifications', get().notifications);
  },
}));

/* ─── getPriceForGrams ───────────────────────────────────────────────────
   Works for both { grams, price } and { pcs, price } tier shapes.
   'qty' is whatever number was selected (grams OR pcs — both stored as qty).
────────────────────────────────────────────────────────────────────────── */
export function getPriceForGrams(prices, qty) {
  if (!prices?.length || qty == null) return null;

  // Normalise: treat pcs as grams internally
  const normalised = prices.map(t => ({
    qty:   t.grams ?? t.pcs,   // unified key
    price: t.price,
  }));

  // Exact match first
  const exact = normalised.find(t => t.qty === qty);
  if (exact) return exact.price;

  // Nearest tier below (pro-rate)
  const sorted = [...normalised].sort((a, b) => b.qty - a.qty);
  const tier   = sorted.find(t => qty >= t.qty);
  if (!tier) return null;
  return Math.round((tier.price / tier.qty) * qty);
}

/* ─── getCartTotal ───────────────────────────────────────────────────────
   Reads item.qty (with fallback to item.grams for old cart entries).
────────────────────────────────────────────────────────────────────────── */
export function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const qty   = item.qty ?? item.grams;   // handle both old and new entries
    const price = getPriceForGrams(item.prices, qty);
    return sum + (price || 0);
  }, 0);
}
