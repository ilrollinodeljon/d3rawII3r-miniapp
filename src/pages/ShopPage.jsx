import { useState, useRef } from 'react';
import Topbar from '../components/Topbar';
import { PRODUCTS, CATEGORIES } from '../config';

/* ─── Swipeable image wrap ─────────────────────────────────────────────── */
function SwipeableImages({ media }) {
  const images = (media ?? []).filter(m => m.type === 'image');
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);
  const moved  = useRef(false);

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
function ProductCard({ p, onNavigate }) {
  const moved = useRef(false);
  const startX = useRef(null);

  const onMouseDown = (e) => { startX.current = e.clientX; moved.current = false; };
  const onMouseMove = (e) => {
    if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8)
      moved.current = true;
  };
  const onMouseUp = () => { startX.current = null; };

  const onClick = () => { if (!moved.current) onNavigate('product', p); };

  return (
    <div
      className="product-card"
      style={{
        opacity: p.soldOut ? 0.60 : 1,
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onClick}
    >
      {/* NEW badge */}
      {p.isNew && !p.soldOut && (
        <div style={{
          position: 'absolute', top: 9, left: 9, zIndex: 3,
          background: 'linear-gradient(135deg,#ff2d00,#ffd000)',
          color: '#fff', fontSize: 9, fontWeight: 900,
          padding: '3px 8px', borderRadius: 20, letterSpacing: 1,
          boxShadow: '0 2px 10px rgba(255,94,0,0.5)',
        }}>NEW</div>
      )}

      {/* SOLD OUT badge */}
      {p.soldOut && (
        <div style={{
          position: 'absolute', top: 9, left: 9, zIndex: 3,
          background: 'rgba(255,68,58,0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,100,90,0.4)',
          color: '#fff', fontSize: 9, fontWeight: 900,
          padding: '3px 8px', borderRadius: 20, letterSpacing: 1,
        }}>SOLD OUT</div>
      )}

      <SwipeableImages media={p.media} />

      <div className="product-card-body">
        {p.brand && <div className="product-card-brand">{p.brand}</div>}
        <div className="product-card-name">{p.name} {p.emoji}</div>
        <div className="product-card-desc">{p.description}</div>
        {p.soldOut
          ? <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 11, marginTop: 6, opacity: 0.85 }}>
              Esaurito · tocca per vedere
            </div>
          : <div className="product-card-price">da €{p.prices[0].price}</div>
        }
      </div>
    </div>
  );
}

/* ─── Category heading ─────────────────────────────────────────────────── */
function CategoryHeading({ label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', marginBottom: 14 }}>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2,
        color: '#fff', fontWeight: 400, flexShrink: 0,
        textShadow: accent
          ? '0 0 18px rgba(244,197,66,0.45)'
          : 'none',
      }}>{label}</h3>
      <div style={{
        flex: 1, height: 1,
        background: accent
          ? 'linear-gradient(to right, rgba(244,197,66,0.30), transparent)'
          : 'linear-gradient(to right, rgba(255,255,255,0.10), transparent)',
      }} />
    </div>
  );
}

/* ─── ShopPage ─────────────────────────────────────────────────────────── */
export default function ShopPage({ onNavigate }) {
  // ✅ Limited to exactly these 2 products in New Arrivals
  const newProducts = PRODUCTS
    .filter(p => 
      ['sunshine_sherbet', 'bufalo_plein'].includes(p.id) && 
      p.isNew && 
      !p.soldOut
    )
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)); // Newest first

  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <h2 className="section-title">🛍️ Shop</h2>

        {/* NEW ARRIVALS - Limited to 2 products */}
        {newProducts.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <CategoryHeading label="🔥 New Arrivals" accent />
            <div className="product-grid">
              {newProducts.map(p => <ProductCard key={p.id} p={p} onNavigate={onNavigate} />)}
            </div>
          </div>
        )}

        {/* CATEGORY SECTIONS */}
        {CATEGORIES.filter(c => c.id !== 'new').map(cat => {
          const products = PRODUCTS
            .filter(p => p.category === cat.id)
            .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

          if (!products.length && !cat.showIfEmpty) return null;

          return (
            <div key={cat.id} style={{ marginBottom: 36 }}>
              <CategoryHeading label={cat.label} accent={false} />
              {products.length > 0
                ? <div className="product-grid">
                    {products.map(p => <ProductCard key={p.id} p={p} onNavigate={onNavigate} />)}
                  </div>
                : <p style={{ color: 'var(--text-sub)', fontSize: 13, padding: '0 16px' }}>
                    Nessun prodotto disponibile.
                  </p>
              }
            </div>
          );
        })}

        {PRODUCTS.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-sub)', padding: '40px 20px' }}>
            Nessun prodotto disponibile al momento.
          </p>
        )}
      </div>
    </div>
  );
}
