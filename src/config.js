// ============================================================
//  therawller CONFIG — Edit everything here
// ============================================================

export const SHOP_CONFIG = {
  name: "",

  logo: "/logo.png",
  background: "/bg.jpg",
  currency: "€",
  minOrderShipping: 100,

  cryptoWallet: {
    address: "YOUR_WALLET_ADDRESS_HERE",
    network: "TRC20",
    coin: "USDT",
  },
};

// ============================================================
//  CATEGORIES
// ============================================================
export const CATEGORIES = [
  { id: "new",   label: "🔥 New Arrivals", showIfEmpty: false },
  { id: "hash",  label: "🍫 Hash",         showIfEmpty: false },
  { id: "weed",  label: "🌿 Weed",         showIfEmpty: false },
];

export const DELIVERY_METHODS = [
  {
    id: "delivery_pavia",
    label: "DELIVERY PV-MI",
    icon: "📍",
    note: "Il servizio di delivery ha un costo aggiuntivo in base al tragitto. Dopo l'approvazione verrai contattato per il prezzo aggiornato.",
    fields: ["zone", "address"],
    extraCost: true,
  },
  {
    id: "ship",
    label: "Ship",
    icon: "🚚",
    note: `Spedizione tramite corriere. Ordine minimo €${100}.`,
    minOrder: 100,
    couriers: [
      {
        id: "inpost",
        label: "InPost",
        icon: "🔒",
        fields: ["nome", "cognome", "telefono", "locker_name", "locker_address", "email"],
      },
      {
        id: "ups",
        label: "UPS",
        icon: "🚛",
        fields: ["nome", "cognome", "telefono", "indirizzo", "cap", "citta"],
      },
    ],
  },
];

export const PAYMENT_METHODS = [
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "cash", label: "Cash", icon: "💶" },
];

// ============================================================
//  PRODUCTS
//  sortOrder: lower = shown first within its category
// ============================================================
export const PRODUCTS = [
  // ── HASH ──────────────────────────────────────────────────
  {
    id: "plasma_static",
    dateAdded: "2026-06-01",
    sortOrder: 1,                    // priciest → first
    name: "Plasma Static",
    soldOut: true,
    category: "hash",
    brand: "H.C.M.",
    emoji: "⚡",
    description: "Electro plasma static.",
    media: [
      { type: "image", url: "/products/plasma_static.jpg" },
      { type: "image", url: "/products/plasma_static_2.jpg" },
      { type: "video", url: "/products/plasma_static.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: ["TMZ (Too Much Zkittlez)", "FF (Forbitten Fruit)"],
    prices: [
      { grams: 10,  price: 220  },
      { grams: 25,  price: 500  },
      { grams: 50,  price: 950  },
      { grams: 100, price: 1500 },
      { grams: 200, price: 2600 },
    ],
  },
  {
    id: "fresh_frozen",
    dateAdded: "2026-06-02",
    sortOrder: 2,
    name: "Fresh frozen s.2026",
    category: "hash",
    isNew: true,
    brand: "H.C.M.",
    emoji: "❄️",
    description: "fresh frozen",
    media: [
      { type: "image", url: "/products/fresh_frozen.jpg" },
      { type: "image", url: "/products/fresh_frozen_2.jpg" },
      { type: "video", url: "/products/fresh_frozen.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: ["Mimosa", "Tiramisu", "Rainbow Mints", "Papaya"],
    prices: [
      { grams: 10,  price: 130  },
      { grams: 25,  price: 280  },
      { grams: 50,  price: 480  },
      { grams: 100, price: 950  },
      { grams: 250, price: 2400 },
      { grams: 500, price: 4450 },
    ],
  },
  {
    id: "bufalo_plein",
    dateAdded: "2026-06-20",
    sortOrder: 3,
    name: "Filtrato 120u🏆",
    category: "hash",
    isNew: true,
    brand: "Bufalo Plein",
    emoji: "",
    description: "filtered 120u",
    media: [
      { type: "image", url: "/products/bufalo_plein.jpg" },
      { type: "image", url: "/products/bufalo_plein_2.jpg" },
      { type: "video", url: "/products/bufalo_plein.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: null,
    prices: [
      { grams: 10,  price: 100  },
      { grams: 25,  price: 220  },
      { grams: 50,  price: 400  },
      { grams: 100, price: 700  },
      { grams: 250, price: 1500 },
      { grams: 500, price: 2800 },
    ],
  },
  {
    id: "filtered_90u",
    dateAdded: "2026-06-10",
    sortOrder: 4,
    name: "WT Filtrato 90u",
    category: "hash",
    isNew: false,
    brand: "Hash Angels",
    emoji: "🎁",
    description: "dry 90u.",
    media: [
      { type: "image", url: "/products/dry_90u.jpg" },
      { type: "image", url: "/products/dry_90u_2.jpg" },
      { type: "video", url: "/products/dry_90u.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: null,
    prices: [
      { grams: 10,  price: 80   },
      { grams: 25,  price: 180  },
      { grams: 50,  price: 280  },
      { grams: 100, price: 440  },
      { grams: 500, price: 1900 },
      { grams: 1000,price: 3200 },
    ],
  },

  // ── WEED ──────────────────────────────────────────────────
  {
    id: "sunshine_sherbet",
    dateAdded: "2026-06-26",
    sortOrder: 1,
    name: "Sunshine Sherbet",
    category: "weed",              // ← moved to weed
    isNew: true,
    brand: "Cali Spain",
    emoji: "🌺",
    description: "Premium Cali Spain Flowes",
    media: [
      { type: "image", url: "/products/cali_spa.jpg" },
      { type: "image", url: "/products/cali_spa_2.jpg" },
      { type: "video", url: "/products/cali_spa.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: null,
    prices: [
      { grams: 10,  price: 120  },
      { grams: 25,  price: 240  },
      { grams: 50,  price: 440  },
      { grams: 100, price: 800  },
      { grams: 250, price: 1850 },
      { grams: 500, price: 3600 },
    ],
  },
];

// ============================================================
//  NOTIFICATIONS
// ============================================================
export const NOTIFICATION_TYPES = [
  { id: "new_products", label: "Nuovi prodotti", sub: "Quando aggiungiamo un prodotto" },
  { id: "promozioni",   label: "Promozioni",     sub: "Offerte e sconti speciali" },
  { id: "news",         label: "News & aggiornamenti", sub: "Novità sul servizio" },
];

// ============================================================
//  LINKS
// ============================================================
export const LINKS = [
  { label: "Instagram", icon: "📸", url: "https://instagram.com/therawller" },
  { label: "BOT aggiornato",    icon: "📢", url: "https://t.me/the_rawller_bot" },
  { label: "Supporto",  icon: "💬", url: "https://t.me/ilrawller" },
];
