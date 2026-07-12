import { create } from 'zustand';

// ── Hardcoded promo codes (non-referral) ──────────────────────────────
const PROMO_CODES = {
  "AMICO10":   { type: "percent", value: 10, description: "10% di sconto" },
  "WELCOME10": { type: "percent", value: 10, description: "10% di sconto benvenuto" },
  "PRIMO10":   { type: "percent", value: 10, description: "10% primo ordine" },
};

export const useStore = create((set, get) => ({
  cart: [],
  orders: [],
  notifications: { new_products: true, promozioni: true, news: true },

  // ── Referral / balance ──────────────────────────────────────────────
  // balance:   €credits earned by THIS user from others using their code
  // referralStats: count of successful referrals
  balance: 0,
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

  appliedDiscount: null,
  discountError: '',

  // ── Cloud helpers ───────────────────────────────────────────────────
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
    get().loadFromCloud('cart',           [],                   (d) => set({ cart: d }));
    get().loadFromCloud('orders',         [],                   (d) => set({ orders: d }));
    get().loadFromCloud('notifications',  get().notifications,  (d) => set({ notifications: d }));
    get().loadFromCloud('checkoutData',   get().checkoutData,   (d) => set({ checkoutData: d }));
    get().loadFromCloud('referralStats',  get().referralStats,  (d) => set({ referralStats: d }));
    get().loadFromCloud('balance',        0,                    (d) => set({ balance: d }));
  },

  updateCheckoutData: (newData) => {
    set(state => ({ checkoutData: { ...state.checkoutData, ...newData } }));
    get().saveToCloud('checkoutData', get().checkoutData);
  },

  // ── Discount logic ──────────────────────────────────────────────────
  // RAW codes = referral codes generated from user IDs
  // Promo codes = PROMO_CODES above
  // Both give 10% — shown as "10% di sconto"
  validateAndApplyDiscount: (code) => {
    const raw = (code ?? '').toUpperCase().trim();

    if (!raw) {
      set({ discountError: 'Inserisci un codice', appliedDiscount: null });
      return false;
    }

    // ── Referral code (RAWxxxxxx) ──
    if (raw.startsWith('RAW')) {
      // Prevent using your own code
      const myUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const myCode   = myUserId ? `RAW${String(myUserId).slice(-6)}` : null;
      if (myCode && raw === myCode) {
        set({ discountError: 'Non puoi usare il tuo stesso codice', appliedDiscount: null });
        return false;
      }

      set({
        discountError: '',
        appliedDiscount: {
          code: raw,
          type: 'percent',
          value: 10,
          description: '10% di sconto',   // ← updated label
          isReferral: true,               // flag so we know to credit the owner
        },
      });
      get().updateCheckoutData({ discount: raw });
      return true;
    }

    // ── Promo code ──
    const info = PROMO_CODES[raw];
    if (!info) {
      set({ discountError: 'Codice non valido', appliedDiscount: null });
      return false;
    }

    // One-time use check (localStorage per user)
    const userId     = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 'guest';
    const storageKey = `usedDiscounts_${userId}`;
    const used       = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (used.includes(raw)) {
      set({ discountError: 'Codice già utilizzato', appliedDiscount: null });
      return false;
    }

    set({
      discountError: '',
      appliedDiscount: {
        code: raw,
        type: info.type,
        value: info.value,
        description: '10% di sconto',     // ← always show this label
        isReferral: false,
      },
    });
    get().updateCheckoutData({ discount: raw });
    return true;
  },

  clearDiscount: () => {
    set({ appliedDiscount: null, discountError: '' });
    get().updateCheckoutData({ discount: '' });
  },

  // Called after order is successfully sent
  markDiscountAsUsed: (code) => {
    const raw        = (code ?? '').toUpperCase().trim();
    const userId     = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 'guest';
    const storageKey = `usedDiscounts_${userId}`;
    const used       = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!used.includes(raw)) {
      localStorage.setItem(storageKey, JSON.stringify([...used, raw]));
    }
  },

  // ── Balance: credit THIS user €10 (called by bot webhook or /credit command) ──
  // In practice your Telegram bot sends a message to the Mini App via
  // sendData / answerWebAppQuery with { action: 'credit', amount: 10 }
  // and the Mini App calls this. Or you call it manually from the bot.
  addBalance: (amount) => {
    set(state => {
      const newBalance = (state.balance || 0) + amount;
      get().saveToCloud('balance', newBalance);
      return { balance: newBalance };
    });
  },

  // ── Increment referral counter for THIS user (code owner) ──────────
  // This is called when your bot confirms a referral order completed.
  incrementReferralSuccess: () => {
    set(state => {
      const newStats = {
        successfulReferrals: (state.referralStats.successfulReferrals || 0) + 1,
        totalEarned:         (state.referralStats.totalEarned         || 0) + 10,
      };
      const newBalance = (state.balance || 0) + 10;
      get().saveToCloud('referralStats', newStats);
      get().saveToCloud('balance', newBalance);
      return { referralStats: newStats, balance: newBalance };
    });
  },

  // ── Cart validation ─────────────────────────────────────────────────
  validateCart: () => {
    const cart = get().cart;
    if (cart.length === 0) return { valid: false, error: 'Il carrello è vuoto' };

    let totalGrams    = 0;
    let hasMrBrownOnly = true;

    for (const item of cart) {
      const qty = item.qty ?? item.grams ?? 0;
      if (!item.name?.toLowerCase().includes('mr brown')) {
        totalGrams += qty;
        hasMrBrownOnly = false;
      }
    }

    if (hasMrBrownOnly && cart.length === 1) {
      return { valid: false, error: 'Mr. Brown non può essere ordinato da solo. Aggiungi almeno 10g di hash o weed.' };
    }
    if (totalGrams < 10 && !hasMrBrownOnly) {
      return { valid: false, error: 'Ordine minimo: 10g di hash/weed.' };
    }

    return { valid: true, error: null };
  },

  // ── Cart CRUD ───────────────────────────────────────────────────────
  addToCart: (product, qty, strain) => {
    const existing = get().cart.find(i => i.productId === product.id && i.strain === strain);
    const image    = product.media?.find(m => m.type === 'image')?.url || product.image || '';
    const unit     = product.unit ?? 'g';

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
          name:      product.name,
          emoji:     product.emoji,
          image,
          qty,
          grams:  qty,
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
        i.productId === productId && i.strain === strain ? { ...i, qty, grams: qty } : i
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
    set(state => ({ notifications: { ...state.notifications, [id]: !state.notifications[id] } }));
    get().saveToCloud('notifications', get().notifications);
  },
}));

// ── Price helpers ─────────────────────────────────────────────────────
export function getPriceForGrams(prices, qty) {
  if (!prices?.length || qty == null) return null;
  const norm    = prices.map(t => ({ qty: t.grams ?? t.pcs, price: t.price }));
  const exact   = norm.find(t => t.qty === qty);
  if (exact) return exact.price;
  const sorted  = [...norm].sort((a, b) => b.qty - a.qty);
  const tier    = sorted.find(t => qty >= t.qty);
  if (!tier) return null;
  return Math.round((tier.price / tier.qty) * qty);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const qty   = item.qty ?? item.grams;
    const price = getPriceForGrams(item.prices, qty);
    return sum + (price || 0);
  }, 0);
}

// ── Apply discount to a subtotal ─────────────────────────────────────
// Use this wherever you compute the final price
export function applyDiscount(subtotal, discount) {
  if (!discount || !subtotal) return subtotal;
  if (discount.type === 'percent') {
    return Math.round(subtotal * (1 - discount.value / 100));
  }
  if (discount.type === 'fixed') {
    return Math.max(0, subtotal - discount.value);
  }
  return subtotal;
}
