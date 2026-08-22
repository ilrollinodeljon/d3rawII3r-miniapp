import { useState, useRef, useEffect } from 'react';
import { PRODUCTS, SHOP_CONFIG } from '../config';
import { getRecentlyViewed } from '../utils/recentlyViewed';

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

  // ── Auto-rotating + swipeable "gear" carousel ───────────────────────
  //
  // WHAT WAS ACTUALLY WRONG LAST TIME: the tripled-array version reset a
  // single global `tick` counter by subtracting n whenever it got too big.
  // That subtraction shifted EVERY card's position by the same amount in
  // the same instant — not just the one card at the boundary — so the
  // entire visible row swapped to unrelated products all at once. That's
  // the "all the products do a switch" you saw.
  //
  // THE FIX: no tripled array, no global reset at all. Each product keeps
  // its own simple index (0..n-1) and we compute, fresh each render, the
  // single nearest lap of the circle for that product — a plain, cheap
  // calculation with no shared state to desync. A wrap point is still
  // mathematically unavoidable somewhere on a circle, so we keep it
  // harmless by making sure it only ever happens *outside* the visible
  // window — i.e. the number of cards shown automatically shrinks a bit
  // for small catalogs, so there's always enough real products to fill
  // the row without needing to double one up mid-screen.
  // ── Auto-rotating + swipeable "gear" carousel ───────────────────────
  //
  // You want the full row of cards visible even with a small catalog —
  // that means some products will occasionally appear twice at once (there
  // just aren't enough distinct items to fill 7 slots otherwise). That's
  // fine and expected. What actually has to never happen is a JUMP: no
  // card should ever teleport from one spot to another.
  //
  // How this stays jump-free: instead of each product having one "current
  // position" that gets recalculated (and can flip) every render, each
  // product can have up to two simultaneous instances — one lap around the
  // circle, and the next lap after it. Each instance's position is a
  // plain, continuous straight-line function of `tick` — it enters the
  // visible row smoothly from one edge and exits smoothly from the other,
  // and a brand-new instance only ever mounts already sitting just outside
  // the edge (invisible-ish, about to glide in), never mid-screen. Nothing
  // is ever reassigned or reset — there's simply nothing left to jump.
  const n = featured.length;

  const [tick, setTick] = useState(0); // never reset — just grows/shrinks freely, forever
  const [dragOffset, setDragOffset] = useState(0); // live px offset while a finger/mouse is down
  const [isDragging, setIsDragging] = useState(false);
  const autoplayRef = useRef(null);
  const dragStartX = useRef(null);
  const wheelRef = useRef(null);
  const movedRef = useRef(false); // true once a drag has moved past a tiny threshold
  const velocityRef = useRef(0);  // px/ms at the moment of release, for flick-to-swipe
  const lastMoveRef = useRef({ x: 0, t: 0 });

  const SPACING = 84;         // px between each card's resting position — tune to taste
  const MAX_STEPS = n <= 1 ? 0 : 3.3; // how many steps out still get rendered (7 cards total)

  const startAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (n <= 1) return;
    autoplayRef.current = setInterval(() => {
      setTick(t => t + 1);
    }, 2400); // faster auto-advance
  };

  useEffect(() => {
    startAutoplay();
    return () => clearInterval(autoplayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // For product `i`, find every "lap" k (i shifted by k full trips around
  // the catalog) whose position currently falls inside the visible window.
  // Usually exactly one; briefly two when a small catalog can't otherwise
  // fill the row. Each (i, k) pair is a stable, independent, continuously-
  // moving instance — nothing about it ever gets reassigned mid-flight.
  const visibleCards = featured.flatMap((p, i) => {
    if (n === 0) return [];
    const kBase = Math.floor((tick - i) / n);
    const out = [];
    for (const k of [kBase, kBase + 1]) {
      const d = i + k * n - tick;
      if (Math.abs(d) <= MAX_STEPS) out.push({ p, i, k, d });
    }
    return out;
  });

  const handleCardTap = (product, d) => {
    if (movedRef.current) return;
    if (Math.round(d) === 0) {
      onNavigate('product', product);
    } else {
      setTick(t => t - d); // shift by exactly this card's current distance → it glides smoothly to center
      startAutoplay();
    }
  };

  // ── Drag-to-swipe: the row follows the finger 1:1 while dragging (no
  // CSS transition, direct tracking). On release, a quick flick carries
  // extra steps in the swipe direction (velocity-based) instead of only
  // ever landing on the nearest card — makes fast swipes actually feel
  // fast instead of always braking to +/-1.
  const onDragStart = (clientX) => {
    dragStartX.current = clientX;
    movedRef.current = false;
    setIsDragging(true);
    velocityRef.current = 0;
    lastMoveRef.current = { x: clientX, t: performance.now() };
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };
  const onDragMove = (clientX) => {
    if (dragStartX.current === null) return;
    const dx = clientX - dragStartX.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    setDragOffset(dx);

    const now = performance.now();
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) {
      const instV = (clientX - lastMoveRef.current.x) / dt; // px/ms
      // light smoothing so one jittery sample can't dominate the flick
      velocityRef.current = velocityRef.current * 0.7 + instV * 0.3;
    }
    lastMoveRef.current = { x: clientX, t: now };
  };
  const onDragEnd = () => {
    if (dragStartX.current === null) return;
    const baseSteps = Math.round(-dragOffset / SPACING);
    // Fast flick adds momentum: extra whole steps in the swipe direction,
    // capped so it never rockets across the whole wheel in one release.
    const flickSteps = Math.abs(velocityRef.current) > 0.5
      ? Math.sign(-velocityRef.current) * Math.min(2, Math.round(Math.abs(velocityRef.current) * 2))
      : 0;
    const steps = baseSteps + (Math.sign(flickSteps) === Math.sign(baseSteps) || baseSteps === 0 ? flickSteps : 0);
    setTick(t => t + steps);
    setDragOffset(0);
    setIsDragging(false);
    dragStartX.current = null;
    velocityRef.current = 0;
    startAutoplay();
  };

  const recentIds = getRecentlyViewed();
  const recentProducts = recentIds
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean);

  return (
    
      <div className="container">
        <div className="spacer-12" />

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: 132, height: 132, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />

          <p style={{
            color: '#ffffffbc',
            fontSize: 17,
            fontWeight: 400,
            letterSpacing: 0.5,
            marginTop: 4,
            marginBottom: 14,
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            textTransform: 'none',
          }}>
            TR Shop, il miglior terpene a casa tua.
          </p>
        </div>

        {/* ── CTA Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ 
              padding: '14px 14px',
              fontSize: 14,
              borderRadius: '9999px',
              height: '54px'
            }}
            onClick={() => onTabChange('orders')}
          >
            <span className="btn-label">📋 I MIEI ORDINI</span>
          </button>
          <button
            className="btn btn-gold"
            style={{ 
              padding: '14px 14px',
              fontSize: 15,
              borderRadius: '9999px',
              height: '54px'
            }}
            onClick={() => onTabChange('shop')}
          >
            <span className="btn-label">🛍️ SHOP</span>
            <span className="resin-drip" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <a
            href="https://t.me/ilrawller"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ 
              padding: '14px 14px',
              fontSize: 15,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '54px'
            }}
          >
            <span className="btn-label">✈️ TELEGRAM</span>
          </a>
          <a
            href="https://instagram.com/therawller"
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ 
              padding: '14px 14px',
              fontSize: 15,
              borderRadius: '9999px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: '54px'
            }}
          >
            <span className="btn-label">📸 INSTAGRAM</span>
          </a>
        </div>

        {/* ── New Drops ── */}
        {featured.length > 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 38,
                letterSpacing: 0,
                color: '#fff',
                textShadow: `
                  0 0 20px rgba(255,255,255,0.6),
                  0 0 40px rgba(244,197,66,0.45),
                  0 4px 12px rgba(0,0,0,0.9)
                `,
                display: 'inline-block',
              }}>
                🔥TASTE THE GAS🔥
              </h2>
            </div>

            <div
              className="featured-wheel"
              ref={wheelRef}
              onTouchStart={e => onDragStart(e.touches[0].clientX)}
              onTouchMove={e => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              onMouseDown={e => onDragStart(e.clientX)}
              onMouseMove={e => { if (dragStartX.current !== null) onDragMove(e.clientX); }}
              onMouseUp={onDragEnd}
              onMouseLeave={() => { if (dragStartX.current !== null) onDragEnd(); }}
            >
              {visibleCards.map(({ p, k, d }) => {
                const liveD = d + (isDragging ? dragOffset / SPACING : 0);
                const absLiveD = Math.abs(liveD);

                // Continuous falloff instead of fixed tiers, so dragging feels
                // like a smooth physical wheel rather than snapping between steps.
                // Falloff is gentler than before — side cards stay noticeably
                // visible instead of fading into the background.
                const t = MAX_STEPS > 0 ? Math.min(absLiveD / MAX_STEPS, 1) : 0;
                const scale = 1 - t * 0.5;
                const dim = 1 - Math.pow(t, 1.2) * 0.55;

                return (
                  <div
                    key={`${p.id}-${k}`}
                    className="featured-wheel-item"
                    style={{
                      transform: `translateX(${liveD * SPACING}px) scale(${scale})`,
                      opacity: dim,
                      filter: `brightness(${0.62 + dim * 0.38})`,
                      zIndex: 10 - Math.round(absLiveD),
                      // Bouncy overshoot-then-settle easing — each card "clicks"
                      // into its resting spot like a gear tooth engaging, and
                      // runs faster than a plain smooth glide.
                      transition: isDragging
                        ? 'none'
                        : 'transform 0.4s cubic-bezier(.3,1.3,.5,1), opacity 0.32s ease-out, filter 0.32s ease-out',
                    }}
                  >
                    <FeaturedCard p={p} onClick={() => handleCardTap(p, liveD)} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Info notice ── */}
        <div className="notice" style={{ marginBottom: 24 }}>
          ⚠️ Ordine minimo €{SHOP_CONFIG.minOrderShipping} per la spedizione tramite corriere.
          
          📍Delivery disponibile solo in Lombardia e Liguria.
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