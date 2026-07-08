import { create } from 'zustand';

const KNOWN_CODES = {
  "AMICO10": { type: "percent", value: 10, description: "10% sul primo ordine" },
  "WELCOME10": { type: "fixed", value: 10, description: "€10 di sconto benvenuto" },
  "PRIMO10": { type: "percent", value: 10, description: "10% primo ordine" },
  "SHARE10": { type: "fixed", value: 10, description: "€10 referral" },
};

export const useStore = create((set, get) => ({
  cart: [],
  orders: [],
  notifications: { new_products: true, promozioni: true, news: true },
  
  // Referral System
  referralStats: {
    successfulReferrals: 0,
    totalEarned: 0,
  },

  checkoutData: {
    delivery: 'delivery_pavia',
    courier: 'inpost',
    payment: 'crypto',
    address: {},
    notes: '',
    discount: '',
  },

  // Discount State
  appliedDiscount: null,
  discountError: '',

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
    get().loadFromCloud('referralStats', get().referralStats, (data) => set({ referralStats: data }));
    get().loadFromCloud('appliedDiscount', null, (data) => set({ appliedDiscount: data }));
  },

  updateCheckoutData: (newData) => {
    set(state => ({ checkoutData: { ...state.checkoutData, ...newData } }));
    get().saveToCloud('checkoutData', get().checkoutData);
  },

  // ==================== DISCOUNT LOGIC ====================
  validateAndApplyDiscount: (code) => {
    if (!code) {
      set({ discountError: "Inserisci un codice", appliedDiscount: null });
      return false;
    }

    const upperCode = code.toUpperCase().trim();
    const discountInfo = KNOWN_CODES[upperCode];

    if (!discountInfo) {
      set({ discountError: "Codice non valido", appliedDiscount: null });
      return false;
    }

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = tgUser?.id || 'guest';
    const storageKey = `usedDiscounts_${userId}`;
    const usedCodes = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (usedCodes.includes(upperCode)) {
      set({ discountError: "Codice già utilizzato", appliedDiscount: null });
      return false;
    }

    set({ 
      discountError: '',
      appliedDiscount: {
        code: upperCode,
        amount: 0, // will be calculated in CartPage with subtotal
        ...discountInfo
      }
    });

    get().updateCheckoutData({ discount: upperCode });
    return true;
  },

  clearDiscount: () => {
    set({ appliedDiscount: null, discountError: '' });
    get().updateCheckoutData({ discount: '' });
  },

  markDiscountAsUsed: (code) => {
    const upperCode = code.toUpperCase().trim();
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const userId = tgUser?.id || 'guest';
    const storageKey = `usedDiscounts_${userId}`;
    
    const usedCodes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!usedCodes.includes(upperCode)) {
      localStorage.setItem(storageKey, JSON.stringify([...usedCodes, upperCode]));
    }
  },

  // ==================== REFERRAL ====================
  incrementReferralSuccess: () => {
    set(state => {
      const newStats = {
        successfulReferrals: (state.referralStats.successfulReferrals || 0) + 1,
        totalEarned: (state.referralStats.totalEarned || 0) + 10,
      };
      get().saveToCloud('referralStats', newStats);
      return { referralStats: newStats };
    });
  },

  // ==================== CART VALIDATION ====================
  validateCart: () => {
    const cart = get().cart;
    if (cart.length === 0) return { valid: false, error: "Il carrello è vuoto" };

    let totalGrams = 0;
    let hasMrBrownOnly = true;

    for (const item of cart) {
      const qty = item.qty ?? item.grams ?? 0;
      
      if (!item.name?.toLowerCase().includes("mr brown")) {
        totalGrams += qty;
        hasMrBrownOnly = false;
      }
    }

    if (totalGrams < 10) {
      return { 
        valid: false, 
        error: "Ordine minimo: 10g di hash/weed (Mr. Brown non conta da solo)" 
      };
    }

    if (hasMrBrownOnly && cart.length === 1) {
      return { 
        valid: false, 
        error: "Mr. Brown non può essere ordinato da solo. Aggiungi almeno 10g di hash o weed." 
      };
    }

    return { valid: true, error: null };
  },

  // Cart Functions
  addToCart: (product, qty, strain) => {
    const existing = get().cart.find(i => i.productId === product.id && i.strain === strain);
    const image = product.media?.find(m => m.type === 'image')?.url || product.image || '';
    const unit = product.unit ?? 'g';

    if (existing) {
      set(state => ({
        cart: state.cart.map(i =>
          i.productId === product.id && i.strain === strain
            ? { ...i, qty: i.qty + qty, grams: i.qty + qty }
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
          qty,
          grams: qty,
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
      cart: state.cart.filter(i => !(i.productId === productId && i.strain === strain)),
    }));
    get().saveToCloud('cart', get().cart);
  },

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

export function getPriceForGrams(prices, qty) {
  if (!prices?.length || qty == null) return null;
  const normalised = prices.map(t => ({ qty: t.grams ?? t.pcs, price: t.price }));
  const exact = normalised.find(t => t.qty === qty);
  if (exact) return exact.price;
  const sorted = [...normalised].sort((a, b) => b.qty - a.qty);
  const tier = sorted.find(t => qty >= t.qty);
  if (!tier) return null;
  return Math.round((tier.price / tier.qty) * qty);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const qty = item.qty ?? item.grams;
    const price = getPriceForGrams(item.prices, qty);
    return sum + (price || 0);
  }, 0);
}