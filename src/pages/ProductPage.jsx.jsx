import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore, getPriceForGrams } from '../store';

export default function ProductPage({ product: p, onBack }) {
  const [qty,    setQty]    = useState(p.prices[0]?.grams ?? p.prices[0]?.pcs ?? p.minQty);
  const [strain, setStrain] = useState(p.strains?.[0] ?? null);
  const [added,  setAdded]  = useState(false);

  const videoRef    = useRef(null);
  const timerRef    = useRef(null);
  const swipeStartX = useRef(null);
  const addToCart   = useStore(s => s.addToCart);

  if (!p) return null;

  const getQtyKey = (tier) => tier.pcs ?? tier.grams;
  const price     = getPriceForGrams(p.prices, qty);
  const mediaList = p.media ?? (p.image ? [{ type: 'image', url: p.image }] : []);

  const initialIndex = useMemo(() => {
    const vi = mediaList.findIndex(m => m.type === 'video');
    return vi !== -1 ? vi : 0;
  }, []);

  const [mediaIndex, setMediaIndex] = useState(initialIndex);
  const current = mediaList[mediaIndex] ?? { type: 'image', url: '' };

  /* ── Auto-advance logic ─────────────────────────────────────── */
  const goNext = useCallback(() => {
    setMediaIndex(i => (i + 1) % mediaList.length);
  }, [mediaList.length]);

  // Clear any running auto-advance timer
  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => {
    clearTimer();

    if (current.type === 'video' && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      v.muted = true;           // start muted — user can unmute via controls
      v.play().catch(() => {});

      // Advance when video ends (only if not the only media)
      const onEnded = () => { if (mediaList.length > 1) goNext(); };
      v.addEventListener('ended', onEnded);
      return () => { v.removeEventListener('ended', onEnded); clearTimer(); };
    }

    // Photo: auto-advance after 3.5s
    if (current.type === 'image' && mediaList.length > 1) {
      timerRef.current = setTimeout(goNext, 2500);
    }
    return () => clearTimer();
  }, [mediaIndex, current.type, goNext, mediaList.length]);

  /* ── Manual navigation — also resets the timer ─────────────── */
  const goMedia = (idx) => {
    clearTimer();
    setMediaIndex((idx + mediaList.length) % mediaList.length);
  };

  /* ── Swipe ──────────────────────────────────────────────────── */
  const onTouchStart = (e) => { swipeStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) > 36) goMedia(mediaIndex + (dx < 0 ? 1 : -1));
    swipeStartX.current = null;
  };

  /* ── Add to cart ────────────────────────────────────────────── */
  const handleAdd = () => {
    if (p.soldOut || qty < p.minQty) return;
    addToCart(p, qty, strain);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  return (
    <div className="page fade-up">

      {/* ── Media gallery ───────────────────────────────────────── */}
      <div
        style={{ position: 'relative', background: 'transparent', touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current.type === 'video' ? (
          <video
            ref={videoRef}
            key={current.url}
            playsInline
            autoPlay
            muted          /* start silent; user taps speaker to unmute */
            loop={mediaList.length === 1}   /* loop only if single media */
            preload="auto"
            controls       /* show native controls so user can unmute */
            controlsList="nodownload nofullscreen noremoteplayback"
            style={{
              width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
            }}
          >
            <source src={current.url} type="video/mp4" />
          </video>
        ) : (
          <img
            src={current.url}
            alt={p.name}
            style={{
              width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
            }}
            onError={e => { e.target.src = 'https://placehold.co/600x800/141414/555?text=NO+IMAGE'; }}
          />
        )}

        {/* Bottom mask — fades media edge to transparent so bg shows through */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 160,
          background: 'transparent',
          WebkitMaskImage: 'none',
          pointerEvents: 'none',
          zIndex: 5,
        }} />

        {/* Dot indicators — Instagram style */}
        {mediaList.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 18, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6,
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            {mediaList.map((_, i) => (
              <div
                key={i}
                style={{
                  width:  i === mediaIndex ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === mediaIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                  transition: 'width 0.25s cubic-bezier(.34,1.56,.64,1), background 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Product content ──────────────────────────────────────── */}
      <div className="container">
        <div className="spacer-20" />

        {p.brand && (
          <div style={{ marginBottom: 10 }}>
            <span style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 14px',
              fontSize: 11, color: 'var(--gold-light)', fontWeight: 700,
            }}>{p.brand}</span>
          </div>
        )}

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>
          {p.name} {p.emoji}
        </h1>
        <p style={{ color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.55 }}>{p.description}</p>

        <div className="spacer-20" />

        {/* Strain selector */}
        {p.strains?.length > 0 && (
          <div className="section-box">
            <div className="section-box-title">🌿 Scegli strain</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {p.strains.map(s => (
                <button key={s} onClick={() => setStrain(s)} style={{
                  padding: '9px 16px', borderRadius: 20,
                  border: strain === s ? '1.5px solid var(--gold-light)' : '1.5px solid var(--border)',
                  background: strain === s ? 'rgba(200,168,75,0.14)' : 'var(--surface2)',
                  color: strain === s ? 'var(--gold-light)' : 'var(--text)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Price tiers + add to cart */}
        <div className="section-box">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
            {p.prices.map(tier => {
              const tq  = getQtyKey(tier);
              const sel = qty === tq;
              return (
                <button key={tq} onClick={() => setQty(tq)} style={{
                  padding: '8px 8px', borderRadius: 9999, height: 52,
                  border: sel ? '1.5px solid var(--gold-light)' : '1.5px solid rgba(255,255,255,0.08)',
                  background: sel ? 'rgba(200,168,75,0.16)' : 'rgba(20,20,20,0.55)',
                  color: sel ? 'var(--gold-light)' : '#e5e5e5',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}>
                  {tq}{p.unit}<br />
                  <span style={{ fontSize: 13 }}>€{tier.price}</span>
                </button>
              );
            })}
          </div>

          <div style={{
            background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            padding: '14px 16px', borderRadius: 12, marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-sub)', fontSize: 14 }}>Selezionato:</span>
            <span style={{ color: 'var(--gold-light)', fontWeight: 800, fontSize: 18 }}>
              {qty} {p.unit} — €{price}
            </span>
          </div>

          {p.soldOut ? (
            <div style={{
              padding: 16, textAlign: 'center',
              background: 'rgba(255,68,58,0.08)',
              border: '1px solid rgba(255,68,58,0.30)',
              borderRadius: 999, color: 'var(--red)', fontWeight: 700,
            }}>✕ Prodotto esaurito</div>
          ) : (
            <button className="btn btn-gold" onClick={handleAdd} disabled={!qty}>
              {added ? '✓ Aggiunto!' : `🛒 Aggiungi ${qty} ${p.unit} al carrello`}
            </button>
          )}
        </div>

        <div className="spacer-20" />
      </div>
    </div>
  );
}
