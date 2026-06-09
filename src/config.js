// ============================================================
//  therawller CONFIG — Edit everything here
// ============================================================

export const SHOP_CONFIG = {
  name: "The Rawller Shop",

  // Logo: place your image in /public/logo.png and reference it here
  logo: "/logo.png",
  // Background art: place in /public/bg.jpg
  background: "/bg.jpg",
  currency: "€",
  // Minimum order for shipping
  minOrderShipping: 100,
  // Telegram Bot token (set in .env as VITE_BOT_TOKEN)
  // Orders group chat ID (set in .env as VITE_ORDER_CHAT_ID)
};

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
//  PRODUCTS — Add / remove / edit freely
//  Each product:
//    id: unique string
//    name: display name
//    brand: brand tag shown above name
//    emoji: emoji shown next to name
//    description: short description
//    image: path in /public/products/
//    minQty: minimum grams per order
//    strains: optional list of strains (null = no strain selector)
//    prices: array of { grams, price } tiers
// ============================================================

export const PRODUCTS = [
  {
    id: "plasma_static",
    name: "Plasma Static",
    soldOut: true,
    brand: "H.C.M.",
    emoji: "⚡",
    description: "Electro plasma static.",
    media: [
  {
    type: "image",
    url: "/products/plasma_static.jpg"
  },
  {
    type: "image",
    url: "/products/plasma_static_2.jpg"
  },
  {
    type: "video",
    url: "/products/plasma_static.mp4"
  }
],
    minQty: 10,
    unit: "g",
    strains: ["TMZ (Too Much Zkittlez)", "FF (Forbitten Fruit)"],
    prices: [
      { grams: 10, price: 220 },
      { grams: 25, price: 500 },
      { grams: 50, price: 950 },
      { grams: 100, price: 1500 },
      { grams: 200, price: 2600 },
    ],
  },
  {

  id: "fresh_frozen",
  name: "fresh frozen",
  brand: "H.C.M.",
  emoji: "❄️",
  description: "fresh frozen",
  media: [
    {
      type: "image",
      url: "/products/fresh_frozen.jpg"
    },
    {
      type: "image",
      url: "/products/fresh_frozen_2.jpg"
    },
    {
      type: "video",
      url: "/products/fresh_frozen.mp4"
    }
  ],
  minQty: 10,
  unit: "g",
  strains: ["Mimosa", "Tiramisu"],
  prices: [
    { grams: 10, price: 130 },
    { grams: 25, price: 280 },
    { grams: 50, price: 480 },
    { grams: 100, price: 950 },
    { grams: 250, price: 2400 },
    { grams: 500, price: 4450 },
  ],
},
  {
  id: "bufalo_plein",
  name: "filtered 120u",
  brand: "Bufalo Plein",
  emoji: "",
  description: "filtered 120u",
  media: [
    {
      type: "image",
      url: "/products/bufalo_plein.jpg"
    },
    {
      type: "image",
      url: "/products/bufalo_plein_2.jpg"
    },
    {
      type: "video",
      url: "/products/bufalo_plein.mp4"
    }
  ],
  minQty: 10,
  unit: "g",
  strains: null,
  prices: [
    { grams: 10, price: 100 },
    { grams: 25, price: 220 },
    { grams: 50, price: 400 },
    { grams: 100, price: 700 },
    { grams: 250, price: 1500 },
    { grams: 500, price: 2800 },
  ],
},
 {
  id: "filtered_90u",
  name: "WT Filtrato 90u",
  brand: null,
  emoji: "🎁",
  description: "dry 90u.",
  media: [
    {
      type: "image",
      url: "/products/dry_90u.jpg"
    },
    {
      type: "image",
      url: "/products/dry_90u_2.jpg"
    },
    {
      type: "video",
      url: "/products/dry_90u.mp4"
    }
  ],
  minQty: 10,
  unit: "g",
  strains: null,
  prices: [
    { grams: 10, price: 80 },
    { grams: 25, price: 180 },
    { grams: 50, price: 280 },
    { grams: 100, price: 440 },
    { grams: 500, price: 1900 },
    { grams: 1000, price: 3200 },
  ],
},
  // ↑ Add more products following the same pattern
];

// ============================================================
//  NOTIFICATIONS (shown in profile page)
// ============================================================
export const NOTIFICATION_TYPES = [
  { id: "new_products", label: "Nuovi prodotti", sub: "Quando aggiungiamo un prodotto" },
  { id: "promozioni", label: "Promozioni", sub: "Offerte e sconti speciali" },
  { id: "news", label: "News & aggiornamenti", sub: "Novità sul servizio" },
];

// ============================================================
//  LINKS (shown in profile page)
// ============================================================
export const LINKS = [
  { label: "Instagram", icon: "📸", url: "https://instagram.com/therawller" },
  { label: "Canale", icon: "📢", url: "https://t.me/YOUR_CHANNEL" },
  { label: "Supporto", icon: "💬", url: "https://t.me/ilrawller" },
];
