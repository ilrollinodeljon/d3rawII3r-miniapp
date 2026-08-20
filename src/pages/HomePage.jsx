import { useState, useRef, useEffect } from 'react';
import { PRODUCTS, SHOP_CONFIG } from '../config';
import { getRecentlyViewed } from '../utils/recentlyViewed';

/* ─── Mini featured card — video (once loaded) or image fallback ───────── */
function FeaturedCard({ p, onNavigate }) {
  const images = (p.media ?? []).filter(m => m.type === 'image');
  const videos = (p.media ?? []).filter(m => m.type === 'video');
  const posterSrc = images[0]?.url ?? (p.image || 'https://placehold.co/300x375/141414/555?text=IMG');
  const videoSrc = videos[0]?.url ?? null;

  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const moved = useRef(false);
  const startX = useRef(null);

  // Only start showing/playing the video once it's fully buffered enough to
  // play through without stalling — until then the poster image stays visible.
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const v = videoRef.current;
    setVideoReady(false);

    const onCanPlayThrough = () => {
      setVideoReady(true);
      v.play().catch(() => {}); // autoplay can be blocked silently — poster stays as fallback
    };
    const onError = () => setVideoReady(false);

    v.addEventListener('canplaythrough', onCanPlayThrough);
    v.addEventListener('error', onError);
    return () => {
      v.removeEventListener('canplaythrough', onCanPlayThrough);
      v.removeEventListener('error', onError);
      v.pause();
    };
  }, [videoSrc]);

  // NOTE: per-image swipe-to-cycle was removed here on purpose — these cards
  // now live in a horizontally swipeable row (see .featured-scroll below),
  // and a second swipe gesture *inside* each card would fight the row's own
  // swipe-to-browse-products gesture. Only the first image / first video is
  // shown per card. If you want multi-image cycling back, it belongs on the
  // full ProductPage instead, not this compact home-row card.
  const onMouseDown = (e) => { startX.current = e.clientX; moved.current = false; };
  const onMouseMove = (e) => {
    if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8)
      moved.current = true;
  };
  const onMouseUp = () => { startX.current = null; };

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

      <div className="product-card-img-wrap" style={{ userSelect: 'none', position: 'relative' }}>
        <img
          src={posterSrc}
          alt={p.name}
          draggable={false}
          style={{
            pointerEvents: 'none',
            opacity: videoReady ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
          onError={e => { e.target.src = 'https://placehold.co/300x375/141414/555?text=IMG'; }}
        />
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 0.35s ease',
              pointerEvents: 'none',
            }}
          />
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
    .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''));

  // Infinite-loop swipeable row: the list is tripled (prev/current/next set)
  // so there's always real content on both sides to scroll into. When the
  // user's swipe gets close to either end, we silently snap scrollLeft back
  // by exactly one set's width — same content, no visible jump — which is
  // what makes it feel like it loops forever in both directions.
  const scrollRef = useRef(null);
  const [rowReady, setRowReady] = useState(false);
  const loopItems = featured.length > 1
    ? [...featured, ...featured, ...featured]
    : featured; // don't loop-triple a single item, nothing to swipe to

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || featured.length <= 1) { setRowReady(true); return; }
    // Wait a frame so the tripled content has actually laid out and
    // scrollWidth is measurable, then start the user on the middle copy.
    requestAnimationFrame(() => {
      const oneSetWidth = el.scrollWidth / 3;
      el.scrollLeft = oneSetWidth;
      setRowReady(true);
    });
  }, [featured.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || featured.length <= 1) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (el.scrollLeft < oneSetWidth * 0.1) {
      el.scrollLeft += oneSetWidth;
    } else if (el.scrollLeft > oneSetWidth * 1.9) {
      el.scrollLeft -= oneSetWidth;
    }
  };

  const recentIds = getRecentlyViewed();
  const recentProducts = recentIds
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean);

  return (
    
      <div className="container">
        <div className="spacer-12" />

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: 128, height: 128, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48,
            letterSpacing: 3,
            marginTop: 8,
            marginBottom: 4,
            color: '#ffffff',
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

          <p style={{
            color: '#ffffffbc',
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: 1,
            marginTop: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            textTransform: 'none',
          }}>
            Il miglior terpene a casa tua.
          </p>
        </div>

        {/* ── CTA Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ 
              padding: '20px 16px',
              fontWeight: 500, 
              fontSize: 18,
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
              fontWeight: 500, 
              fontSize: 18,
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
              fontWeight: 500, 
              fontSize: 18,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '68px'
            }}
          >
            ✈️ Telegram
          </a>
          <a
            href="https://instagram.com/therawller"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ 
              padding: '20px 16px',
              fontWeight: 500, 
              fontSize: 18,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '68px'
            }}
          >
            📸 Instagram
          </a>
        </div>

        {/* ── New Drops ── */}
        {featured.length > 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 48,
                letterSpacing: 5,
                color: '#fff',
                textShadow: `
                  0 0 20px rgba(255,255,255,0.6),
                  0 0 40px rgba(244,197,66,0.45),
                  0 4px 12px rgba(0,0,0,0.9)
                `,
                display: 'inline-block',
              }}>
                🔥NEW DROPS🔥
              </h2>
            </div>

            <div
              className="featured-scroll"
              ref={scrollRef}
              onScroll={handleScroll}
              style={{ marginBottom: 24, opacity: rowReady ? 1 : 0, transition: 'opacity 0.2s ease' }}
            >
              {loopItems.map((p, i) => (
                <div key={`${p.id}-${i}`} className="featured-scroll-item">
                  <FeaturedCard p={p} onNavigate={onNavigate} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Info notice ── */}
        <div className="notice" style={{ marginBottom: 24 }}>
          ⚠️ Ordine minimo €{SHOP_CONFIG.minOrderShipping} per la spedizione tramite corriere.
          Delivery disponibile solo in Lombardia e Liguria.
        </div>

        {/* ── Recently viewed ── */}
        {recentProducts.length > 0 && (
          <div className="recent-section">
            <div className="recent-header">
              <span>👁</span> Visti di recente
            </div>
            <div className="recent-scroll">
              {recentProducts.map(p => {
                const img = (p.media ?? []).find(m => m.type === 'image')?.url
                  ?? 'https://placehold.co/200x200/141414/555?text=IMG';
                return (
                  <div key={p.id} className="recent-card" onClick={() => onNavigate('product', p)}>
                    <div className="recent-card-img">
                      <img src={img} alt="" onError={e => { e.target.src = 'https://placehold.co/200x200/141414/555?text=IMG'; }} />
                    </div>
                    <div className="recent-card-name">{p.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="spacer-16" />
      </div>
    
  );
}