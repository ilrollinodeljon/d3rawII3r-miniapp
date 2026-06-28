import { useStore } from '../store';
import { SHOP_CONFIG } from '../config';

export default function OrdersPage() {
  const orders = useStore(s => s.orders);

  return (
    
      <div className="container">
        <h2 className="section-title">📋 I miei ordini</h2>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Nessun ordine</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => (
              <div key={order.id} className="section-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                    {new Date(order.date).toLocaleDateString('it-IT')}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--gold)',
                    background: 'rgba(245,166,35,0.12)', padding: '2px 8px', borderRadius: 10
                  }}>
                    {order.status}
                  </span>
                </div>
                {order.cart.map((item, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 4, color: 'var(--text-sub)' }}>
                    • {item.name} — {item.grams}g
                  </div>
                ))}
                <div style={{ marginTop: 10, fontWeight: 800, color: 'var(--gold)', fontSize: 18 }}>
                  {SHOP_CONFIG.currency}{order.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    
  );
}