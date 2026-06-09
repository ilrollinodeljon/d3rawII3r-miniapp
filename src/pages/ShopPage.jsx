import Topbar from '../components/Topbar';
import { PRODUCTS } from '../config';

export default function ShopPage({ onNavigate }) {
  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <h2 className="section-title">🛍️ Shop</h2>
      </div>
      <div className="product-grid" style={{ paddingBottom: 16 }}>
        {PRODUCTS.map(p => {
          const image = p.media
            ? p.media.find(m => m.type === 'image')?.url
            : p.image;
          return (
  <div
    key={p.id}
    className="product-card"
    onClick={() => {
      if (!p.soldOut) onNavigate('product', p);
    }}
    style={{
      opacity: p.soldOut ? 0.45 : 1,
      cursor: p.soldOut ? 'not-allowed' : 'pointer',
    }}
  >
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
  <div
    style={{
      color: '#ff4d4d',
      fontWeight: 800,
      fontSize: 16,
      marginTop: 8,
    }}
  >
    SOLD OUT
  </div>
) : (
  <div className="product-card-price">
    da €{p.prices[0].price}
  </div>
)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
