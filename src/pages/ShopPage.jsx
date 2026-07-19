import { useState, useRef, useMemo } from 'react';
import { PRODUCTS, CATEGORIES } from '../config';

/* Fallback icons if a category in config.js doesn't define its own `emoji` */
const CATEGORY_ICON_FALLBACK = {
  hash: '📦',
  weed: '🌿',
  edibles: '🍬',
  extracts: '💧',
};

/* ─── Swipeable image wrap ─────────────────────────────────────────────── */
function SwipeableImages({ media }) {
  const images = (media ?? []).filter(m => m.type === 'image');
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);
  const moved = useRef(false);

  const go = (dir) => setIdx(i => (i + dir + images.length) % images.length);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; moved.current = false; };
  const onTouchMove  = (e) => { if (startX.current !== null && Math.abs(e.touches[0].clientX - startX.current) > 8) moved.current = true; };
  const onTouchEnd   = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 28) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const onMouseDown = (e) => { startX.current = e.clientX; moved.current = false; };
  const onMouseMove = (e) => { if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8) moved.current = true; };
  const onMouseUp   = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 28) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const fallback = 'https://placehold.co/300x375/141414/555?text=IMG';

  if (images.length === 0) {
    return (
      <div className="product-card-img-wrap">
        <img src={fallback} alt="" />
      </div>
    );
  }

  return (
    <div
      className="product-card-img-wrap"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{ userSelect: 'none', cursor: images.length > 1 ? 'grab' : 'default' }}
    >
      <img
        src={images[idx].url}
        alt=""
        draggable={false}
        style={{ pointerEvents: 'none' }}
        onError={e => { e.target.src = fallback; }}
      />
      {images.length > 1 && (
        <div className="product-card-dots">
          {images.map((_, i) => (
            <div key={i} className={`product-card-dot${i === idx ? ' active' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Product card ─────────────────────────────────────────────────────── */
function ProductCard({ p, onNavigate, isFav, onToggleFav }) {
  const moved = useRef(false);
  const startX = useRef(null);

  const onMouseDown = (e) => { startX.current = e.clientX; moved.current = false; };
  const onMouseMove = (e) => {
    if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8)
      moved.current = true;
  };
  const onMouseUp = () => { startX.current = null; };

  const onClick = () => { if (!moved.current) onNavigate('product', p); };

  const imageCount = (p.media ?? []).filter(m => m.type === 'image').length;

  return (
    <div
      className="product-card"
      style={{ cursor: 'pointer', position: 'relative' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onClick}
    >
      <div style={{ position: 'relative' }}>
        {p.isNew && !p.soldOut && (
          <div style={{
            position: 'absolute', top: 9, right: 9, zIndex: 3,
            background: 'linear-gradient(135deg,#ff2d00,#ffd000)',
            color: '#fff', fontSize: 9, fontWeight: 900,
            padding: '3px 8px', borderRadius: 20, letterSpacing: 1,
            boxShadow: '0 2px 10px rgba(255,94,0,0.5)',
          }}>NEW</div>
        )}

        {p.brand && <div className="product-card-badge">{p.brand}</div>}

        <button
          type="button"
          className={`product-card-fav-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFav(p.id); }}
          aria-label="Preferiti"
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {imageCount > 1 && (
          <div className="product-card-media-count">+{imageCount - 1}</div>
        )}

        {p.soldOut && (
          <div className="product-card-soldout-banner">Esaurito</div>
        )}

        <SwipeableImages media={p.media} />
      </div>

      <div className="product-card-body" style={{ opacity: p.soldOut ? 0.6 : 1 }}>
        <div className="product-card-name">{p.name} {p.emoji}</div>
        <div className="product-card-desc">{p.description}</div>
        {p.soldOut
          ? <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 11, marginTop: 8, opacity: 0.85 }}>
              Tocca per vedere
            </div>
          : <>
              <div className="product-card-price-label">A partire da</div>
              <div className="product-card-price">€{p.prices[0].price}</div>
            </>
        }
      </div>
    </div>
  );
}

/* ─── ShopPage ─────────────────────────────────────────────────────────── */
export default function ShopPage({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  // NOTE: favorites are kept in local component state only — they reset on
  // page unmount/reload. To persist across the app (and across sessions),
  // move this into the Zustand store the same way cart/orders are handled.
  const [favorites, setFavorites] = useState(() => new Set());

  const toggleFav = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pills = [
    { id: 'all', label: 'Tutti', icon: null },
    { id: 'new', label: 'Novità', icon: '🔥' },
    ...CATEGORIES.filter(c => c.id !== 'new').map(c => ({
      id: c.id,
      label: c.label,
      icon: c.emoji || CATEGORY_ICON_FALLBACK[c.id] || '📦',
    })),
  ];

  const inPriceRange = (price) => {
    switch (priceFilter) {
      case 'under-50': return price < 50;
      case '50-100': return price >= 50 && price <= 100;
      case '100-200': return price > 100 && price <= 200;
      case 'over-200': return price > 200;
      default: return true;
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = PRODUCTS.filter(p => {
      if (activeCategory === 'new' && !(p.isNew && !p.soldOut)) return false;
      if (activeCategory !== 'all' && activeCategory !== 'new' && p.category !== activeCategory) return false;
      if (!inPriceRange(p.prices[0]?.price ?? 0)) return false;
      if (q) {
        const haystack = `${p.name} ${p.brand ?? ''} ${p.description ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'price-asc':
        list = [...list].sort((a, b) => (a.prices[0]?.price ?? 0) - (b.prices[0]?.price ?? 0));
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => (b.prices[0]?.price ?? 0) - (a.prices[0]?.price ?? 0));
        break;
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        list = [...list].sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''));
        break;
      default:
        list = [...list].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    }

    return list;
  }, [search, activeCategory, priceFilter, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setPriceFilter('all');
    setSortBy('default');
  };

  return (
    <div className="container -70">
      <div className="shop-hero">
        <div className="shop-hero-count">{PRODUCTS.length} PRODOTTI</div>
        <h2 className="shop-hero-title">Il Catalogo</h2>
        <div className="shop-hero-divider" />
      </div>

      <div className="shop-search-row">
        <div className="shop-search-wrap">
          <span className="field-icon">🔍</span>
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="shop-reset-btn" onClick={resetFilters} aria-label="Reimposta filtri" title="Reimposta filtri">
          ⚖️
        </button>
      </div>

      <div className="category-pills">
        {pills.map(c => (
          <div
            key={c.id}
            className={`category-pill ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.icon && <span>{c.icon}</span>}
            {c.label}
          </div>
        ))}
      </div>

      <div className="filter-row">
        <div className="filter-select-btn">
          <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
            <option value="all">Filtra per prezzo</option>
            <option value="under-50">Fino a 50€</option>
            <option value="50-100">50€ - 100€</option>
            <option value="100-200">100€ - 200€</option>
            <option value="over-200">Oltre 200€</option>
          </select>
        </div>
        <div className="filter-select-btn">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">Ordine predefinito</option>
            <option value="price-asc">Prezzo: crescente</option>
            <option value="price-desc">Prezzo: decrescente</option>
            <option value="name">Nome A-Z</option>
            <option value="newest">Più recenti</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              onNavigate={onNavigate}
              isFav={favorites.has(p.id)}
              onToggleFav={toggleFav}
            />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-sub)', padding: '40px 20px' }}>
          Nessun prodotto trovato.
        </p>
      )}
    </div>
  );
}
