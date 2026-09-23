// utils/recentlyViewed.js
//
// Tracks which products the visitor has recently looked at, stored in
// localStorage (this is a real browser app, not a Claude artifact, so
// localStorage is fine here — it's not the sandboxed artifact environment
// that restriction applies to).
//
// NOTE: I don't have your current HomePage.jsx, so I don't know the exact
// shape it expects back from getRecentlyViewed(). This returns an array of
// product IDs, most-recently-viewed first — if your call site expects full
// product objects instead, use getRecentlyViewedProducts(PRODUCTS) below,
// or paste the exact usage line and I'll match it precisely.

const STORAGE_KEY = 'rawller_recently_viewed';
const MAX_ITEMS = 12;

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId) {
  if (!productId) return;
  try {
    const current = getRecentlyViewed().filter(id => id !== productId);
    current.unshift(productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fail silently,
    // this is a nice-to-have feature, not critical path
  }
}

// Convenience: resolve stored IDs back to full product objects, in the
// same most-recent-first order, skipping any that no longer exist in the
// catalog (removed/renamed products).
export function getRecentlyViewedProducts(allProducts) {
  const ids = getRecentlyViewed();
  const byId = new Map(allProducts.map(p => [p.id, p]));
  return ids.map(id => byId.get(id)).filter(Boolean);
}
