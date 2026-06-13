import Topbar from '../components/Topbar';
import { PRODUCTS, SHOP_CONFIG } from '../config';

export default function HomePage({ onNavigate, onTabChange }) {
  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        {/* Reduced top spacing */}
        <div className="spacer-12" />

        {/* Hero - Tighter spacing */}
        <div style={{ textAlign: 'center', padding: '5px 0 16px' }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: 130, height: 130, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 42, 
            letterSpacing: 4, 
            marginTop: 6,
            marginBottom: 6
          }}>
            {SHOP_CONFIG.name}
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
            Il meglio terpene, a casa tua.
          </p>
        </div>

        {/* Row 1: Ordini + Shop - Slimmer + More Transparent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '18px 16px', fontWeight: 700, fontSize: 15, minHeight: '74px' }} 
            onClick={() => onTabChange('orders')}
          >
            📋I miei ordini
          </button>

          <button 
            className="btn btn-gold" 
            style={{ padding: '18px 16px', fontWeight: 700, fontSize: 15, minHeight: '74px' }} 
            onClick={() => onTabChange('shop')}
          >
            🛍️SHOP🛍️
          </button>
        </div>

        {/* Row 2: Telegram + Instagram - Slimmer + More Transparent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          <a 
            href="https://t.me/ilrawller" 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ padding: '18px 16px', fontWeight: 700, fontSize: 15, textDecoration: 'none', minHeight: '74px' }}
          >
            <span style={{ fontSize: 20 }}>✈️</span> Telegram
          </a>

          <a 
            href="https://instagram.com/therawller" 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ padding: '18px 16px', fontWeight: 700, fontSize: 15, textDecoration: 'none', minHeight: '74px' }}
          >
            <span style={{ fontSize: 20 }}>📸</span> Instagram
          </a>
        </div>

        {/* NEW DROPS */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 42,
          letterSpacing: 4,
          marginBottom: 16,
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 0 20px #7DD99A, 0 0 40px #F4C542, 0 4px 12px rgba(0,0,0,0.9)',
        }}>
          🔥NEW DROPS🔥
        </h2>

        {/* Featured products */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 28 }}>
          {PRODUCTS
            .filter(p => ['plasma_static', 'fresh_frozen', 'bufalo_plein', 'filtered_90u'].includes(p.id) && !p.soldOut)
            .map(p => {
              const image = p.media ? p.media.find(m => m.type === 'image')?.url : p.image;
              return (
                <div key={p.id} className="product-card" onClick={() => onNavigate('product', p)}>
                  <img src={image} alt={p.name} onError={e => { e.target.src = 'https://placehold.co/300x300/101610/888?text=IMG'; }} />
                  <div className="product-card-body">
                    {p.brand && <div className="product-card-brand" style={{ fontSize: 9 }}>{p.brand}</div>}
                    <div className="product-card-name" style={{ fontSize: 12 }}>{p.name} {p.emoji}</div>
                    <div className="product-card-price" style={{ fontSize: 11 }}>da €{p.prices[0].price}</div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Info box */}
        <div className="notice" style={{ marginBottom: 28, lineHeight: 1.6 }}>
          ⚠️ Ordine minimo €{SHOP_CONFIG.minOrderShipping} per la spedizione tramite corriere.
          Delivery disponibile solo in Lombardia e Liguria.
        </div>

        <div className="spacer-16" />
      </div>
    </div>
  );
}
