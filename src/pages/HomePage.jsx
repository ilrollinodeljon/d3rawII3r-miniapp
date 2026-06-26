import { useState, useRef } from 'react';
import Topbar from '../components/Topbar';
import { PRODUCTS, SHOP_CONFIG } from '../config';

/* ─── Mini swipeable card ─────────────────────────────────────────────── */
function FeaturedCard({ p, onNavigate }) {
  const images = (p.media ?? []).filter(m => m.type === 'image');
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
  const onMouseUp   = () => { startX.current = null; };

  const imgSrc = images[idx]?.url ?? (p.image || 'https://placehold.co/300x375/141414/555?text=IMG');

  return (
    <div
      className="product-card"
      style={{ cursor: 'pointer', position: 'relative' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={() => { if (!moved.current) onNavigate('product', p); }}
    >
      {p.isNew && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 3,
          background: 'linear-gradient(135deg,#ff2d00,#ffd000)',
          color: '#fff', fontSize: 8, fontWeight: 900,
          padding: '2px 7px', borderRadius: 20, letterSpacing: 1,
          boxShadow: '0 2px 8px rgb(255, 0, 0)',
        }}>NEW</div>
      )}

      <div
        className="product-card-img-wrap"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ userSelect: 'none' }}
      >
        <img
          src={imgSrc}
          alt={p.name}
          draggable={false}
          style={{ pointerEvents: 'none' }}
          onError={e => { e.target.src = 'https://placehold.co/300x375/141414/555?text=IMG'; }}
        />
        {images.length > 1 && (
          <div className="product-card-dots">
            {images.map((_, i) => (
              <div key={i} className={`product-card-dot${i === idx ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="product-card-body">
        {p.brand && <div className="product-card-brand" style={{ fontSize: 9 }}>{p.brand}</div>}
        <div className="product-card-name" style={{ fontSize: 13 }}>{p.name} {p.emoji}</div>
        <div className="product-card-price" style={{ fontSize: 12 }}>da €{p.prices[0].price}</div>
      </div>
    </div>
  );
}

/* ─── HomePage ────────────────────────────────────────────────────────── */
export default function HomePage({ onNavigate, onTabChange }) {
  const featured = PRODUCTS
    .filter(p => p.isNew === true && !p.soldOut)
    .slice(0, 3);

  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <div className="spacer-12" />

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '16px 0 22px' }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: 128, height: 128, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 47,
            letterSpacing: 5,
            marginTop: 10,
            marginBottom: 6,
            color: '#ffffff',
            /* Subtle multi-layer neon — not harsh, just glowing */
            textShadow: `
              0 0 10px rgba(255,255,255,0.45),
              0 0 28px rgba(0, 37, 4, 0.33),
              0 0 60px rgba(200,168,75,0.28),
              0 0 90px rgba(200,168,75,0.14),
              0 4px 12px rgba(0,0,0,0.80)
            `,
          }}>
            THE RAWLLER SHOP
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 16 }}>
            Il miglior terpene a casa tua.
          </p>
        </div>

       {/* ── CTA Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ 
              padding: '20px 16px',
              fontWeight: 700, 
              fontSize: 16,
              borderRadius: '9999px',
              height: '68px'
            }}
            onClick={() => onTabChange('orders')}
          >
            📋 I miei ordini
          </button>
          <button
            className="btn btn-gold"
            style={{ 
              padding: '20px 16px',
              fontWeight: 700, 
              fontSize: 16,
              borderRadius: '9999px',
              height: '68px'
            }}
            onClick={() => onTabChange('shop')}
          >
            🛍️ SHOP
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          <a
            href="https://t.me/ilrawller"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ 
              padding: '20px 16px',
              fontWeight: 700, 
              fontSize: 16,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '68px'
            }}
          >
            <span style={{ fontSize: 20 }}>✈️</span> Telegram
          </a>
          <a
            href="https://instagram.com/therawller"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ 
              padding: '20px 16px',
              fontWeight: 700, 
              fontSize: 16,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '68px'
            }}
          >
            <span style={{ fontSize: 20 }}>📸</span> Instagram
          </a>
        </div>

        {/* ── New Drops ── */}
        {featured.length > 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                /* Bigger than before */
                fontSize: 48,
                letterSpacing: 5,
                color: '#fff',
                /* Same subtle neon treatment as title */
                textShadow: `
                  0 0 10px rgba(255,255,255,0.45),
                  0 0 30px rgba(244,197,66,0.55),
                  0 0 65px rgba(200,168,75,0.30),
                  0 0 100px rgba(200,168,75,0.15),
                  0 4px 12px rgba(0,0,0,0.80)
                `,
                display: 'inline-block',
              }}>
                🔥 NEW DROPS 🔥
              </h2>
            </div>

            <div className="product-grid-3" style={{ marginBottom: 24 }}>
              {featured.map(p => (
                <FeaturedCard key={p.id} p={p} onNavigate={onNavigate} />
              ))}
            </div>
          </>
        )}

        {/* ── Info notice ── */}
        <div className="notice" style={{ marginBottom: 24 }}>
          ⚠️ Ordine minimo €{SHOP_CONFIG.minOrderShipping} per la spedizione tramite corriere.
          Delivery disponibile solo in Lombardia e Liguria.
        </div>

        <div className="spacer-16" />
      </div>
    </div>
  );
}
