export default function BottomNav({ active, onChange, cartCount }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'HOME' },
    { id: 'shop', icon: '🛍️', label: 'SHOP' },
    { id: 'cart', icon: '🛒', label: 'CARRELLO', badge: cartCount },
    { id: 'orders', icon: '📋', label: 'ORDINI' },
    { id: 'support', icon: '💬', label: 'SUPPORTO' },
    { id: 'profile', icon: '👤', label: 'PROFILO' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
          style={{ position: 'relative' }}
        >
          {t.badge > 0 && (
            <span className="nav-badge">{t.badge}</span>
          )}
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
