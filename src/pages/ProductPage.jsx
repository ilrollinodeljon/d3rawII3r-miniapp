import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore, getPriceForGrams } from '../store';

export default function ProductPage({ product: p, onBack }) {
  const [qty, setQty] = useState(p.prices[0]?.grams ?? p.prices[0]?.pcs ?? p.minQty);
  const [strain, setStrain] = useState(p.strains?.[0] ?? null);
  const [added, setAdded] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const swipeStartX = useRef(null);
  const addToCart = useStore(s => s.addToCart);

  if (!p) return null;

  const getQtyKey = (tier) => tier.pcs ?? tier.grams;
  const price = getPriceForGrams(p.prices, qty);
  const mediaList = p.media ?? (p.image ? [{ type: 'image', url: p.image }] : []);
  
  const initialIndex = useMemo(() => {
    const vi = mediaList.findIndex(m => m.type === 'video');
    return vi !== -1 ? vi : 0;
  }, [mediaList]);

  const [mediaIndex, setMediaIndex] = useState(initialIndex);
  const current = mediaList[mediaIndex] ?? { type: 'image', url: '' };

  // Telegram Back Button
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !onBack) return;
    tg.BackButton.show();
    const handler = () => onBack();
    tg.BackButton.onClick(handler);
    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [onBack]);

  const goNext = useCallback(() => {
    setMediaIndex(i => (i + 1) % mediaList.length);
  }, [mediaList.length]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Optimized video handling
  useEffect(() => {
    clearTimer();

    if (current.type === 'video' && videoRef.current) {
      const v = videoRef.current;
      
      // Reset and prepare video
      v.currentTime = 0;
      v.muted = muted;
      
      // Ensure proper preload behavior
      if (v.preload !== 'metadata') {
        v.preload = 'metadata';
      }

      const playPromise = v.play().catch(() => {});
      
      const onEnded = () => {
        if (mediaList.length > 1) goNext();
      };
      
      v.addEventListener('ended', onEnded);
      
      return () => {
        v.removeEventListener('ended', onEnded);
        // Pause and clean up when unmounting/switching
        v.pause();
      };
    }

    if (current.type === 'image' && mediaList.length > 1) {
      timerRef.current = setTimeout(goNext, 2500);
    }

    return () => clearTimer();
  }, [mediaIndex, current.type, goNext, mediaList.length, muted]);

  const goMedia = (idx) => {
    clearTimer();
    setMediaIndex((idx + mediaList.length) % mediaList.length);
  };

  const onTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) > 36) {
      goMedia(mediaIndex + (dx < 0 ? 1 : -1));
    }
    swipeStartX.current = null;
  };

  const handleAdd = () => {
    if (p.soldOut || qty < p.minQty) return;
    addToCart(p, qty, strain);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  return (
    <div className="page fade-up">
      {/* Media Gallery */}
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
            muted={muted} 
            loop={mediaList.length === 1}
            preload="metadata"           // ← Key optimization: only load metadata until play()
            autoPlay={false}             // ← Controlled via useEffect + .play() for better control
            style={{ 
              width: '100%', 
              aspectRatio: '3/4', 
              objectFit: 'cover', 
              display: 'block',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)' 
            }}
          >
            <source src={current.url} type="video/mp4" />
          </video>
        ) : (
          <img 
            src={current.url} 
            alt={p.name}
            style={{ 
              width: '100%', 
              aspectRatio: '3/4', 
              objectFit: 'cover', 
              display: 'block',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)' 
            }}
            onError={e => { 
              e.target.src = 'https://placehold.co/600x800/141414/555?text=NO+IMAGE'; 
            }} 
          />
        )}

        {/* Mute Button */}
        <button 
          onClick={() => setMuted(m => !m)}
          style={{ 
            position: 'absolute', 
            top: 6, 
            right: 16, 
            width: 42, 
            height: 42, 
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)', 
            background: 'rgba(0,0,0,0.45)', 
            backdropFilter: 'blur(12px)',
            color: '#fff', 
            fontSize: 18, 
            zIndex: 30 
          }}
        >
          {muted ? '🔈' : '🔊'}
        </button>

        {/* Compact Info Overlay */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10, zIndex: 20 }}>
          {p.brand && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ 
                background: 'rgba(8,8,8,0.55)', 
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 999, 
                padding: '3px 11px',
                fontSize: 11, 
                fontWeight: 700, 
                color: 'var(--gold-light)' 
              }}>
                {p.brand}
              </span>
            </div>
          )}
          <h1 style={{ 
            margin: 2, 
            fontFamily: 'var(--font-display)', 
            fontSize: 34, 
            lineHeight: 0.96,
            letterSpacing: 0.5, 
            color: '#fff', 
            textShadow: '0 2px 12px rgba(0,0,0,0.7)' 
          }}>
            {p.name} {p.emoji}
          </h1>
          <p style={{ 
            margin: 2, 
            marginTop: 10, 
            color: 'rgba(255,255,255,0.88)', 
            fontSize: 14.5, 
            lineHeight: 1.35 
          }}>
            {p.description}
          </p>

          {/* Media Dots */}
          {mediaList.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
              {mediaList.map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => goMedia(i)}
                  style={{ 
                    width: i === mediaIndex ? 16 : 6, 
                    height: 6, 
                    borderRadius: 999,
                    background: i === mediaIndex ? '#fff' : 'rgba(255,255,255,0.4)', 
                    cursor: 'pointer' 
                  }} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {mediaList.length > 1 && (
          <>
            <button 
              onClick={() => goMedia(mediaIndex - 1)}
              style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: 44, 
                height: 44, 
                borderRadius: '50%', 
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(20px)', 
                color: '#fff', 
                fontSize: 24, 
                zIndex: 25 
              }}
            >
              ←
            </button>
            <button 
              onClick={() => goMedia(mediaIndex + 1)}
              style={{ 
                position: 'absolute', 
                right: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: 44, 
                height: 44, 
                borderRadius: '50%', 
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(20px)', 
                color: '#fff', 
                fontSize: 24, 
                zIndex: 25 
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Price & Add to Cart - Very close to the image */}
      <div className="container" style={{ marginTop: 10 }}>
                {p.strains?.length > 0 && (
          <div className="section-box">
            <div className="section-box-title">🌿 Scegli strain</div>
            
            {/* Added spacing here */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 8,
              marginTop: 12   // ← Added space between title and buttons
            }}>
              {p.strains.map(s => (
                <button 
                  key={s} 
                  onClick={() => setStrain(s)}
                  style={{ 
                    padding: '9px 16px', 
                    borderRadius: 20,
                    border: strain === s ? '1.5px solid var(--gold-light)' : '1.5px solid var(--border)',
                    background: strain === s ? 'rgba(200,168,75,0.14)' : 'var(--surface2)',
                    color: strain === s ? 'var(--gold-light)' : 'var(--text)', 
                    fontSize: 13, 
                    fontWeight: 600 
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="section-box">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {p.prices.map(tier => {
              const tq = getQtyKey(tier);
              const sel = qty === tq;
              return (
                <button 
                  key={tq} 
                  onClick={() => setQty(tq)}
                  style={{ 
                    padding: '8px 8px', 
                    borderRadius: 9999, 
                    height: 52,
                    border: sel ? '1.5px solid var(--gold-light)' : '1.5px solid rgba(255,255,255,0.08)',
                    background: sel ? 'rgba(200,168,75,0.16)' : 'rgba(20,20,20,0.55)',
                    color: sel ? 'var(--gold-light)' : '#e5e5e5', 
                    fontWeight: 700, 
                    fontSize: 14 
                  }}
                >
                  {tq}{p.unit}<br />
                  <span style={{ fontSize: 13 }}>€{tier.price}</span>
                </button>
              );
            })}
          </div>

          <div style={{ 
            background: 'rgba(15,15,15,0.6)', 
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '14px 16px', 
            borderRadius: 12, 
            marginBottom: 16, 
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <span style={{ color: 'var(--text-sub)', fontSize: 14 }}>Selezionato:</span>
            <span style={{ color: 'var(--gold-light)', fontWeight: 800, fontSize: 18 }}>
              {qty} {p.unit} — €{price}
            </span>
          </div>

          {p.soldOut ? (
            <div style={{ 
              padding: 16, 
              textAlign: 'center', 
              background: 'rgba(255,68,58,0.08)',
              border: '1px solid rgba(255,68,58,0.30)', 
              borderRadius: 999, 
              color: 'var(--red)', 
              fontWeight: 700 
            }}>
              ✕ Prodotto esaurito
            </div>
          ) : (
            <button className="btn btn-gold" onClick={handleAdd} disabled={!qty}>
              {added ? '✓ Aggiunto!' : `🛒 Aggiungi ${qty} ${p.unit} al carrello`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
