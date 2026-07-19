const KEY = 'rawller_recently_viewed';
const MAX_ITEMS = 10;

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/**
 * Call this from ProductPage.jsx when a product is opened, e.g.:
 *   useEffect(() => { addRecentlyViewed(product.id); }, [product.id]);
 */
export function addRecentlyViewed(productId) {
  try {
    const current = getRecentlyViewed().filter(id => id !== productId);
    current.unshift(productId);
    localStorage.setItem(KEY, JSON.stringify(current.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.) — fail silently
  }
}
