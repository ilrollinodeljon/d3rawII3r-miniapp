import { useState } from 'react';
import Topbar from '../components/Topbar';
import { useStore, getPriceForGrams } from '../store';

export default function ProductPage({ product: p, onBack }) {
  const [qty, setQty] = useState(p.prices[0]?.grams || p.minQty);
  const [strain, setStrain] = useState(p.strains?.[0] || null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [added, setAdded] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const addToCart = useStore(s => s.addToCart);

  if (!p) return null;

  const price = getPriceForGrams(p.prices, qty);
  const mediaList = p.media || (p.image ? [{ type: 'image', url: p.image }] : []);
  const currentMedia = mediaList[mediaIndex] || { type: 'image', url: '' };

  const handleAdd = () => {
    if (qty < p.minQty) return;
    addToCart(p, qty, strain);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  return (
    <div className="page fade-up">
      <Topbar onBack={onBack} />

      <div>
        {/* Media Gallery */}
        <div style={{ position: 'relative', background: 'var(--surface2)' }}>
          {currentMedia.type === 'video' ? (
            <video
              key={currentMedia.url}
              controls
              playsInline
              autoPlay
              muted
              loop
              preload="metadata"
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', background: '#000' }}
            >
              <source src={currentMedia.url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={currentMedia.url}
              alt={p.name}
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }}
              onError={e => { e.target.src = 'https://placehold.co/600x450/141414/888?text=NO+IMAGE'; }}
            />
          )}

          {mediaList.length > 1 && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.75)', color: '#fff',
              fontSize: 12, padding: '3px 9px', borderRadius: 12,
            }}>
              {mediaIndex + 1} / {mediaList.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {mediaList.length > 1 && (
          <div style={{
            display: 'flex', gap: 8, padding: '12px 16px',
            overflowX: 'auto', background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}>
            {mediaList.map((item, index) => (
              <button
                key={index}
                onClick={() => setMediaIndex(index)}
                style={{
                  width: 68, height: 68, borderRadius: 10,
                  overflow: 'hidden', flexShrink: 0,
                  border: mediaIndex === index ? '3px solid var(--gold)' : '2px solid var(--border)',
                  background: 'var(--surface2)', position: 'relative',
                  cursor: 'pointer',
                }}
              >
                {item.type === 'video' ? (
                  <>
                    <img
                      src={item.url.replace('.mp4', '.jpg')}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.45)', fontSize: 26,
                    }}>▶️</div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = 'https://placehold.co/68x68/222/666?text=IMG'; }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="container">
          <div className="spacer-20" />

          {/* Brand */}
          {p.brand && (
            <div style={{ marginBottom: 8 }}>
              <span style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '4px 12px', fontSize: 12,
                color: 'var(--gold)', fontWeight: 700, letterSpacing: 1,
              }}>{p.brand}</span>
            </div>
          )}

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1, lineHeight: 1.15 }}>
            {p.name} {p.emoji || ''}
          </h1>
          <p style={{ color: 'var(--text-sub)', marginTop: 6, fontSize: 15 }}>{p.description}</p>

          <div className="spacer-20" />

          {/* Price List */}
          <div className="section-box">
            <div className="section-box-title">📋 LISTINO PREZZI</div>
            <div className="price-list">
              {p.prices.map(tier => (
                <div key={tier.grams} className="price-row">
                  <span className="price-grams">{tier.grams}g</span>
                  <span className="price-val">€{tier.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strain Selector */}
          {p.strains && p.strains.length > 0 && (
            <div className="section-box">
              <div className="section-box-title">🌿 Scegli strain</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.strains.map(s => (
                  <button
                    key={s}
                    onClick={() => setStrain(s)}
                    style={{
                      padding: '9px 16px', borderRadius: 20,
                      border: '2px solid',
                      borderColor: strain === s ? 'var(--gold)' : 'var(--border)',
                      background: strain === s ? 'rgba(61,170,92,0.12)' : 'var(--surface2)',
                      color: 'var(--text)', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 600,
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="section-box">
            <div className="section-box-title">🛒 Aggiungi al carrello</div>

            <div style={{ color: 'var(--gold)', fontSize: 13.5, marginBottom: 12 }}>
              
            </div>

            {/* Quantity Tier Selector */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 10, 
              marginBottom: 18 
            }}>
              {p.prices.map((tier) => {
                const isSelected = qty === tier.grams;
                return (
                  <button
                    key={tier.grams}
                    onClick={() => setQty(tier.grams)}
                    style={{
                      flex: '1 1 auto',
                      minWidth: '110px',
                      padding: '12px 16px',
                      borderRadius: 20,
                      border: '2px solid',
                      borderColor: isSelected ? 'var(--gold)' : 'var(--border)',
                      background: isSelected ? 'rgba(61,170,92,0.15)' : 'var(--surface2)',
                      color: isSelected ? 'var(--gold)' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    {tier.grams}g<br />
                    <span style={{ fontSize: 13, opacity: 0.9 }}>€{tier.price}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Selection */}
            <div style={{ 
              background: 'var(--surface2)', 
              padding: '14px 16px', 
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Selezionato:</span>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 21 }}>
                {qty}g — €{price}
              </span>
            </div>

            <button
              className="btn btn-gold"
              onClick={handleAdd}
              disabled={!qty}
              style={{ width: '100%' }}
            >
              {added ? '✓ Aggiunto!' : `🛒 Aggiungi ${qty}g al carrello`}
            </button>
          </div>

          {/* Reviews */}
          <div className="section-box">
            <div className="section-box-title">⭐ Recensioni (0)</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>La tua recensione</div>
              <div className="stars" style={{ marginBottom: 12 }}>
                {[1,2,3,4,5].map(n => (
                  <span
                    key={n}
                    className={`star${n > rating ? ' empty' : ''}`}
                    onClick={() => setRating(n)}
                  >★</span>
                ))}
              </div>
              <textarea
                className="field"
                placeholder="Commento..."
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{ resize: 'none' }}
              />
              <div className="spacer-12" />
              <button className="btn btn-gold btn-sm" style={{ width: 'auto', padding: '10px 24px' }}>
                Invia
              </button>
              <p style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 8 }}>
                Le recensioni vengono pubblicate dopo approvazione
              </p>
            </div>
          </div>

          <div className="spacer-20" />
        </div>
      </div>
    </div>
  );
}