import Topbar from '../components/Topbar';
import { PRODUCTS, CATEGORIES } from '../config';

function ProductCard({ p, onNavigate }) {
  const image = p.media ? p.media.find(m => m.type === 'image')?.url : p.image;

  return (
    <div
      className="product-card"
      onClick={() => { if (!p.soldOut) onNavigate('product', p); }}
      style={{ 
        opacity: p.soldOut ? 0.45 : 1, 
        cursor: p.soldOut ? 'not-allowed' : 'pointer', 
        position: 'relative' 
      }}
    >
      {p.isNew && !p.soldOut && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          background: 'linear-gradient(135deg, var(--green), #F4C542)',
          color: '#000', fontSize: 9, fontWeight: 900,
          padding: '3px 8px', borderRadius: 20, letterSpacing: 1,
        }}>NEW</div>
      )}

      <img
        src={image}
        alt={p.name}
        onError={e => { e.target.src = 'https://placehold.co/300x300/141414/888?text=IMG'; }}
      />

      <div className="product-card-body">
        {p.brand && <div className="product-card-brand">{p.brand}</div>}
        <div className="product-card-name">{p.name} {p.emoji}</div>
        <div className="product-card-desc">{p.description}</div>
        
        {p.soldOut ? (
          <div style={{ color: '#ff4d4d', fontWeight: 800, fontSize: 16, marginTop: 8 }}>
            SOLD OUT
          </div>
        ) : (
          <div className="product-card-price">da €{p.prices[0].price}</div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage({ onNavigate }) {
  const newProducts = PRODUCTS.filter(p => p.isNew && !p.soldOut);

  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <h2 className="section-title">🛍️ Shop</h2>

        {/* NEW ARRIVALS */}
        {newProducts.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 16px', marginBottom: 12,
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, letterSpacing: 2,
                color: '#fff',
                textShadow: '0 0 16px #7DD99A, 0 0 32px #F4C542',
              }}>🔥 New Arrivals</h3>
              <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(to right, rgba(125,217,154,0.4), transparent)',
              }} />
            </div>

            <div className="product-grid">
              {newProducts.map(p => (
                <ProductCard key={p.id} p={p} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY SECTIONS */}
        {CATEGORIES.filter(cat => cat.id !== 'new').map(cat => {
          const products = PRODUCTS.filter(p => p.category === cat.id);
          
          if (!products.length && !cat.showIfEmpty) return null;

          return (
            <div key={cat.id} style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 16px', marginBottom: 12,
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, letterSpacing: 2, color: '#fff',
                }}>{cat.label}</h3>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(to right, rgba(255,255,255,0.15), transparent)',
                }} />
              </div>

              {products.length > 0 ? (
                <div className="product-grid">
                  {products.map(p => (
                    <ProductCard key={p.id} p={p} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-sub)', fontSize: 13, padding: '0 16px' }}>
                  Nessun prodotto disponibile.
                </p>
              )}
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
