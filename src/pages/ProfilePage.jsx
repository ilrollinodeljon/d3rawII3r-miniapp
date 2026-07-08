import { useStore } from '../store';
import { NOTIFICATION_TYPES, LINKS } from '../config';

export default function ProfilePage() {
  const notifications = useStore(s => s.notifications);
  const toggleNotification = useStore(s => s.toggleNotification);
  const orders = useStore(s => s.orders);
  const referralStats = useStore(s => s.referralStats);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  
  const initial = user?.first_name?.[0]?.toUpperCase() || 'G';
  const username = user?.username || 'colewayne';
  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Grenadier';

  // Auto-generated referral code
  const referralCode = user 
    ? `RAW${user.id.toString().slice(-6)}` 
    : 'RAW000000';

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    
    const btn = document.getElementById('copy-btn');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = '✅ Copiato!';
      setTimeout(() => { btn.textContent = original; }, 2000);
    }
  };

  const earned = (referralStats?.successfulReferrals || 0) * 10;

  return (
    <div className="container">
      <div className="spacer-20" />

      {/* Avatar + name - Now with real Telegram photo */}
      <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 60 }}>
        {user?.photo_url ? (
          <img 
            src={user.photo_url} 
            alt={displayName}
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--gold-light)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex'; // fallback to initial
            }}
          />
        ) : (
          <div className="avatar">{initial}</div>
        )}

        <h2 style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>{displayName}</h2>
        <p style={{ color: 'var(--text-sub)', marginTop: 4}}>@{username}</p>
        
        <div className="spacer-12" />
        <span className="new-badge">
          <span className="dot" /> Nuovo
        </span>
        <p style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 8 }}>
          Iscritto dal 14 maggio 2026
        </p>
      </div>

      {/* Referral Code + Stats */}
      <div className="section-box" style={{ marginBottom: 16 }}>
        <div className="section-box-title">🎟️ Il tuo Codice Referral</div>
        
        <div style={{ 
          background: 'rgba(200,168,75,0.12)', 
          border: '1px solid rgba(200,168,75,0.3)', 
          borderRadius: 12, 
          padding: '16px',
          textAlign: 'center',
          marginTop: 12
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, color: 'var(--gold-light)' }}>
            {referralCode}
          </div>
          
          <button 
            id="copy-btn"
            onClick={copyReferralCode}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              background: 'var(--gold-light)',
              color: '#000',
              border: 'none',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 14
            }}
          >
            📋 Copia Codice
          </button>

          {/* Referral Stats */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#4ade80' }}>
                  {referralStats?.successfulReferrals || 0}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Amici</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gold-light)' }}>
                  €{earned}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Guadagnati</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 12 }}>
            €10 di credito per ogni amico che completa il primo ordine
          </p>
        </div>
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