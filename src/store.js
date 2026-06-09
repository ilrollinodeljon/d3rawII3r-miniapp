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
    get().loadFromCloud('cart', [], (data) => set({ cart: data }));
    get().loadFromCloud('orders', [], (data) => set({ orders: data }));
    get().loadFromCloud('notifications', get().notifications, (data) => set({ notifications: data }));
    get().loadFromCloud('checkoutData', get().checkoutData, (data) => set({ checkoutData: data }));
  },

  updateCheckoutData: (newData) => {
    set(state => ({ checkoutData: { ...state.checkoutData, ...newData } }));
    get().saveToCloud('checkoutData', get().checkoutData);
  },

  addToCart: (product, grams, strain) => {
    const existing = get().cart.find(i => i.productId === product.id && i.strain === strain);
    const image = product.media?.find(m => m.type === 'image')?.url || product.image || '';

    if (existing) {
      set(state => ({
        cart: state.cart.map(i =>
          i.productId === product.id && i.strain === strain
            ? { ...i, grams: i.grams + grams }
            : i
        ),
      }));
    } else {
      set(state => ({
        cart: [...state.cart, {
          productId: product.id,
          name: product.name,
          emoji: product.emoji,
          image,
          grams,
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
      cart: state.cart.filter(i => !(i.productId === productId && i.strain === strain)),
    }));
    get().saveToCloud('cart', get().cart);
  },

  updateQty: (productId, strain, grams) => {
    set(state => ({
      cart: state.cart.map(i =>
        i.productId === productId && i.strain === strain ? { ...i, grams } : i
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

export function getPriceForGrams(prices, grams) {
  const exact = prices.find(t => t.grams === grams);
  if (exact) return exact.price;
  const sorted = [...prices].sort((a, b) => b.grams - a.grams);
  const tier = sorted.find(t => grams >= t.grams);
  if (!tier) return null;
  return Math.round((tier.price / tier.grams) * grams);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const price = getPriceForGrams(item.prices, item.grams);
    return sum + (price || 0);
  }, 0);
}
