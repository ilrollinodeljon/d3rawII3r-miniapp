// npm install lucide-react
// If any import below errors, your installed lucide-react version renamed it —
// UserCircle is sometimes aliased as CircleUser in newer releases; swap as needed.
import { Home, Store, ShoppingCart, ClipboardList, MessageCircle, UserCircle } from 'lucide-react';

export default function BottomNav({ active, onChange, cartCount }) {
  const tabs = [
    { id: 'home', Icon: Home, label: 'HOME' },
    { id: 'shop', Icon: Store, label: 'SHOP' },
    { id: 'cart', Icon: ShoppingCart, label: 'CARRELLO', badge: cartCount },
    { id: 'orders', Icon: ClipboardList, label: 'ORDINI' },
    { id: 'support', Icon: MessageCircle, label: 'SUPPORTO' },
    { id: 'profile', Icon: UserCircle, label: 'PROFILO' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.badge > 0 && (
              <span className="nav-badge">{t.badge}</span>
            )}
            <t.Icon className="nav-icon" size={24} strokeWidth={isActive ? 2.1 : 1.6} />
            <span className="nav-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}''
