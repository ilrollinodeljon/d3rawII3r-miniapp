import { useState, useRef, useEffect, useMemo } from 'react';
import Topbar from '../components/Topbar';
import { useStore, getPriceForGrams } from '../store';

export default function ProductPage({ product: p, onBack }) {
  const [qty,    setQty]    = useState(p.prices[0]?.grams ?? p.prices[0]?.pcs ?? p.minQty);
  const [strain, setStrain] = useState(p.strains?.[0] ?? null);
  const [rating, setRating] = useState(5);
  const [comment,setComment]= useState('');
  const [added,  setAdded]  = useState(false);
  
  const videoRef = useRef(null);
  const swipeStartX = useRef(null);

  const addToCart = useStore(s => s.addToCart);

  if (!p) return null;

  // Support both grams and pcs
  const getQtyKey = (tier) => tier.pcs ?? tier.grams;
  const price = getPriceForGrams(p.prices, qty); // keep for now

  const mediaList = p.media ?? (p.image ? [{ type: 'image', url: p.image }] : []);

  const initialMediaIndex = useMemo(() => {
    const videoIndex = mediaList.findIndex(m => m.type === 'video');
    return videoIndex !== -1 ? videoIndex : 0;
  }, [mediaList]);

  const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
  const current = mediaList[mediaIndex] ?? { type: 'image', url: '' };

  const goMedia = (dir) => {
    const newIndex = (mediaIndex + dir + mediaList.length) % mediaList.length;
    setMediaIndex(newIndex);
  };

  useEffect(() => {
    if (current.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [mediaIndex, current.type]);

  const handleAdd = () => {
    if (p.soldOut || qty < p.minQty) return;
    addToCart(p, qty, strain);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const onTouchStart = (e) => { swipeStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) > 36) goMedia(dx < 0 ? 1 : -1);
    swipeStartX.current = null;
  };

  return (
    <div className="page fade-up">
      <Topbar onBack={onBack} />

      {/* Media Section */}
      <div style={{ position: 'relative', background: '#000', touchAction: 'pan-y' }}
           onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {current.type === 'video' ? (
          <video ref={videoRef} key={current.url} controls playsInline autoPlay loop preload="metadata"
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}>
            <source src={current.url} type="video/mp4" />
          </video>
        ) : (
          <img src={current.url} alt={p.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
               onError={e => e.target.src = 'https://placehold.co/600x450/141414/555?text=NO+IMAGE'} />
        )}

        {mediaList.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
            {mediaList.map((item, i) => (
              <button key={i} onClick={() => setMediaIndex(i)}
                style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', border: i === mediaIndex ? '2.5px solid #4ade80' : '2px solid rgba(255,255,255,0.25)' }}>
                {item.type === 'video' ? (
                  <>
                    <img src={item.url.replace('.mp4', '.jpg')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                         onError={e => e.target.style.display = 'none'} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', fontSize: 18 }}>▶️</div>
                  </>
                ) : (
                  <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="container">
        <div className="spacer-20" />

        {p.brand && <div style={{ marginBottom: 10 }}><span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: 'var(--gold-light)', fontWeight: 700 }}>{p.brand}</span></div>}

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>{p.name} {p.emoji}</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: 6 }}>{p.description}</p>

        <div className="spacer-20" />

        {/* Strain Selector */}
        {p.strains?.length > 0 && (
          <div className="section-box">
            <div className="section-box-title">🌿 Scegli strain</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {p.strains.map(s => (
                <button key={s} onClick={() => setStrain(s)} style={{
                  padding: '9px 16px', borderRadius: 20, border: strain === s ? '1.5px solid var(--gold-light)' : '1.5px solid var(--border)',
                  background: strain === s ? 'rgba(74,222,128,0.12)' : 'var(--surface2)', color: strain === s ? '#4ade80' : 'var(--text)'
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Price Tiers */}
        <div className="section-box">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
            {p.prices.map(tier => {
              const tierQty = getQtyKey(tier);
              const isSelected = qty === tierQty;
              return (
                <button key={tierQty} onClick={() => setQty(tierQty)}
                  style={{
                    padding: '8px 8px', borderRadius: 9999,
                    border: isSelected ? '1.5px solid #4ade80' : '1.5px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(74,222,128,0.18)' : 'rgba(20,20,20,0.55)',
                    color: isSelected ? '#4ade80' : '#e5e5e5',
                    fontWeight: 700, fontSize: 14, height: '52px'
                  }}>
                  {tierQty}{p.unit}<br />
                  <span style={{ fontSize: 13 }}>€{tier.price}</span>
                </button>
              );
            })}
          </div>

          <div style={{ background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', borderRadius: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Selezionato:</span>
            <span style={{ color: '#4ade80', fontWeight: 800 }}>{qty} {p.unit} — €{price}</span>
          </div>

          {p.soldOut ? (
            <div style={{ padding: '16px', background: 'rgba(255,68,58,0.1)', border: '1px solid rgba(255,68,58,0.4)', borderRadius: 999, textAlign: 'center', color: 'var(--red)' }}>
              Prodotto esaurito
            </div>
          ) : (
            <button className="btn btn-gold" onClick={handleAdd}>
              {added ? '✓ Aggiunto!' : `🛒 Aggiungi ${qty} ${p.unit} al carrello`}
            </button>
          )}
        </div>

        <div className="spacer-20" />
      </div>
    </div>
  );
}
