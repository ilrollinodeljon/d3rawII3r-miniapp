import { useState, useRef, useEffect } from 'react';
import { PRODUCTS, SHOP_CONFIG } from '../config';
import { getRecentlyViewed } from '../utils/recentlyViewed';

// Shortest signed distance from `index` to `center` around a circle of size n.
// e.g. n=6, center=0, index=5 → -1 (one step left), not +5 (five steps right).
function signedCircularDistance(index, center, n) {
  if (n === 0) return 0;
  let d = index - center;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/* ─── Mini featured card — video (once loaded) or image fallback ───────── */
function FeaturedCard({ p, onClick }) {
  const images = (p.media ?? []).filter(m => m.type === 'image');
  const videos = (p.media ?? []).filter(m => m.type === 'video');
  const posterSrc = images[0]?.url ?? (p.image || 'https://placehold.co/300x375/141414/555?text=IMG');
  const videoSrc = videos[0]?.url ?? null;

  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

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

  return (
    <div className="product-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={onClick}>
      {p.isNew && !p.soldOut && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 3,
          background: 'linear-gradient(135deg,#ff2d00,#ffd000)',
          color: '#fff', fontSize: 8, fontWeight: 900,
          padding: '2px 7px', borderRadius: 20, letterSpacing: 1,
          boxShadow: '0 2px 8px rgb(255, 0, 0)',
        }}>NEW</div>
      )}

      {p.soldOut && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', zIndex: 4,
          transform: 'translate(-50%, -50%)',
          background: 'rgba(220,42,42,0.92)',
          color: '#fff', fontSize: 10, fontWeight: 900,
          padding: '5px 14px', borderRadius: 20, letterSpacing: 1,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
        }}>ESAURITO</div>
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

      <div className="product-card-body" style={{ opacity: p.soldOut ? 0.55 : 1 }}>
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
    .filter(p => p.isNew === true)
    .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''));

  // ── Auto-rotating "wheel" carousel ──────────────────────────────────
  // The centered card is full-size/bright; cards further out (by shortest
  // circular distance) shrink and darken. Advances on its own every few
  // seconds and loops forever — tapping a side card also jumps it to center
  // and resets the timer, so a manual tap doesn't get immediately undone by
  // the next auto-tick.
  const n = featured.length;
  const [centerIndex, setCenterIndex] = useState(0);
  const autoplayRef = useRef(null);

  const startAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (n <= 1) return;
    autoplayRef.current = setInterval(() => {
      setCenterIndex(i => (i + 1) % n);
    }, 4600); // was 3200ms — slowed to match the smoother/longer 1.1s glide below
  };

  useEffect(() => {
    startAutoplay();
    return () => clearInterval(autoplayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const goToCard = (index, product) => {
    const d = signedCircularDistance(index, centerIndex, n);
    if (d === 0) {
      onNavigate('product', product);
    } else {
      setCenterIndex(index);
      startAutoplay(); // give the user's own pick a full interval before it auto-advances again
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

            <div className="featured-wheel">
              {featured.map((p, i) => {
                const d = signedCircularDistance(i, centerIndex, n);
                const absD = Math.abs(d);
                if (absD > 2) return null; // only render the 5 cards that could plausibly be visible

                const scale = absD === 0 ? 1 : absD === 1 ? 0.9 : 0.48;
                const dim = absD === 0 ? 1 : absD === 1 ? 0.85 : 0.16;
                const spacing = 108; // px offset per step away from center

                return (
                  <div
                    key={p.id}
                    className="featured-wheel-item"
                    style={{
                      transform: `translateX(${d * spacing}px) scale(${scale})`,
                      opacity: dim,
                      filter: `brightness(${0.4 + dim * 0.6})`,
                      zIndex: 10 - absD,
                    }}
                  >
                    <FeaturedCard p={p} onClick={() => goToCard(i, p)} />
                  </div>
                );
              })}
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