// ============================================================
//  therawller CONFIG
// ============================================================

export const SHOP_CONFIG = {
  name: "The Rawller",

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
  { id: "new",      label: "🔥 New Arrivals", showIfEmpty: false },
  { id: "hash",     label: "🍫 Hash",         showIfEmpty: false },
  { id: "weed",     label: "🌿 Weed",         showIfEmpty: false },
  { id: "edibles",  label: "🍬 Edibles",      showIfEmpty: false },
  { id: "extracts",  label: "🍯 Extracts",      showIfEmpty: false },
];

export const DELIVERY_METHODS = [
  {
    id: "delivery_pavia",
    label: "Delivery PV-MI",
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
  { id: "cash",   label: "Cash",   icon: "💶" },
];

// ============================================================
//  PRODUCTS
//  sortOrder: lower number = shown first within category
// ============================================================
export const PRODUCTS = [
  // ── HASH ──────────────────────────────────────────────────
  {
    id: "plasma_static",
    dateAdded: "2026-06-01",
    sortOrder: 1,
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
      { grams: 10,  price: 220 },
      { grams: 25,  price: 500 },
      { grams: 50,  price: 950 },
      { grams: 100, price: 1500 },
      { grams: 200, price: 2600 },
    ],
  },
  {
    id: "fresh_frozen",
    dateAdded: "2026-06-02",
    sortOrder: 2,
    name: "Fresh frozen s2026❄️",
    category: "hash",
    isNew: false,
    brand: "H.C.M.",
    emoji: "",
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
      { grams: 10,  price: 130 },
      { grams: 25,  price: 280 },
      { grams: 50,  price: 480 },
      { grams: 100, price: 950 },
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
      { grams: 10,  price: 100 },
      { grams: 25,  price: 220 },
      { grams: 50,  price: 400 },
      { grams: 100, price: 700 },
      { grams: 250, price: 1500 },
      { grams: 500, price: 2800 },
    ],
  },
  {
    id: "filtered_90u",
    dateAdded: "2026-06-10",
    sortOrder: 4,
    name: "WT Filtrato 90u🎁",
    category: "hash",
    isNew: false,
    brand: "Hash Angels",
    emoji: "",
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
      { grams: 10,   price: 80 },
      { grams: 25,   price: 180 },
      { grams: 50,   price: 280 },
      { grams: 100,  price: 440 },
      { grams: 500,  price: 1900 },
      { grams: 1000, price: 3200 },
    ],
  },

  // ── WEED ──────────────────────────────────────────────────
  {
    id: "sunset_sherbet",
    dateAdded: "2026-06-26",
    sortOrder: 1,
    name: "Sunset Sherbet🌺",
    category: "weed",
    isNew: true,
    brand: "Cali Spain Top Shelf",
    emoji: "",
    description: "Premium Cali Spain Flowers — https://www.leafly.com/strains/sunset-sherbert",
    media: [
      { type: "image", url: "/products/cali_spa.jpg" },
      { type: "image", url: "/products/cali_spa_2.jpg" },
      { type: "video", url: "/products/cali_spa.mp4" }
    ],
    minQty: 10,
    unit: "g",
    strains: null,
    prices: [
      { grams: 10,  price: 120 },
      { grams: 25,  price: 240 },
      { grams: 50,  price: 440 },
      { grams: 100, price: 800 },
      { grams: 250, price: 1850 },
      { grams: 500, price: 3600 },
    ],
  },

  // ── EDIBLES ───────────────────────────────────────────────
  {
    id: "mr_brown",
    dateAdded: "2026-06-26",
    sortOrder: 1,
    name: "Mr. Brown🧁",
    category: "edibles",
    isNew: true,
    brand: "THC EDIBLES",
    emoji: "",
    description: "Brownie al cioccolato infuso al THC",
    media: [
      { type: "image", url: "/products/mr_brown.jpg" },
      { type: "video", url: "/products/mr_brown_2.mp4" },
      { type: "video", url: "/products/mr_brown.mp4" }
    ],
    minQty: 2,
  unit: "pz",
  strains: null,
  prices: [
    { pcs: 2,   price: 30 },
    { pcs: 5,   price: 50 },
    { pcs: 10,  price: 80 },
    { pcs: 20,  price: 140 },
    { pcs: 50,  price: 380 },
    { pcs: 100, price: 700 },
    ],
  }
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
  { label: "Instagram",      icon: "📸", url: "https://instagram.com/therawller" },
  { label: "BOT aggiornato", icon: "📢", url: "https://t.me/the_rawller_bot" },
  { label: "Supporto",       icon: "💬", url: "https://t.me/ilrawller" },
];
