import { useStore } from '../store';
import { NOTIFICATION_TYPES, LINKS } from '../config';

export default function ProfilePage() {
  const notifications = useStore(s => s.notifications);
  const toggleNotification = useStore(s => s.toggleNotification);
  const orders = useStore(s => s.orders);
  const cart = useStore(s => s.cart);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const initial = user?.first_name?.[0]?.toUpperCase() || 'G';
  const username = user?.username || 'colewayne';
  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Grenadier';

  return (
    
      <div className="container">
        <div className="spacer-20" />

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 60 }}>
          <div className="avatar">{initial}</div>
          <h2 style={{ fontWeight: 800, fontSize: 22 }}>{displayName}</h2>
          <p style={{ color: 'var(--text-sub)', marginTop: 4}}>@{username}</p>
          <div className="spacer-12" />
          <span className="new-badge">
            <span className="dot" /> Nuovo
          </span>
          <p style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 8 }}>
            Iscritto dal 14 maggio 2026
          </p>
        </div>

        {/* Stats */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-num">6</div>
              <div className="stat-label">PRODOTTI VISTI</div>
            </div>
            <div className="stat-box">
              <div className="stat-num red">{orders.length}</div>
              <div className="stat-label">PREFERITI</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">0</div>
              <div className="stat-label">RECENSIONI</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="section-box" style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            🔗 Links
          </div>
          {LINKS.map(link => (
            <a
              key={link.label}
              href={link.url}
              className="link-row"
              target="_blank"
              rel="noreferrer"
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
            </a>
          ))}
        </div>

        {/* Notifications */}
        <div className="section-box">
          <div className="section-box-title">🔔 Notifiche</div>
          {NOTIFICATION_TYPES.map(n => (
            <div key={n.id} className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">{n.label}</div>
                <div className="toggle-sub">{n.sub}</div>
              </div>
              <div
                className={`toggle ${notifications[n.id] ? 'on' : ''}`}
                onClick={() => toggleNotification(n.id)}
              />
            </div>
          ))}
        </div>

        <div className="spacer-20" />
      </div>
    
  );
}