import { useStore } from '../store';
import { NOTIFICATION_TYPES, LINKS } from '../config';

export default function ProfilePage() {
  const notifications      = useStore(s => s.notifications);
  const toggleNotification = useStore(s => s.toggleNotification);
  const orders             = useStore(s => s.orders);
  const referralStats      = useStore(s => s.referralStats);
  const balance            = useStore(s => s.balance) || 0;

  const user        = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const initial     = user?.first_name?.[0]?.toUpperCase() || 'G';
  const username    = user?.username || 'utente';
  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Utente';
  const referralCode = user ? `RAW${String(user.id).slice(-6)}` : 'RAW000000';

  const copyReferralCode = () => {
    navigator.clipboard?.writeText(referralCode);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    const btn = document.getElementById('copy-btn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✅ Copiato!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  };

  return (
    <div className="container">
      <div className="spacer-20" />

      {/* ── Avatar ── */}
      <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 40 }}>
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt={displayName}
            style={{
              width: 110, height: 110, borderRadius: '50%', objectFit: 'cover',
              border: '3px solid var(--gold-light)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          />
        ) : (
          <div className="avatar">{initial}</div>
        )}
        <h2 style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>{displayName}</h2>
        <p style={{ color: 'var(--text-sub)', marginTop: 4 }}>@{username}</p>
        <div className="spacer-12" />
        <span className="new-badge"><span className="dot" /> Nuovo</span>
      </div>

      {/* ── Balance card ── */}
      <div className="section-box" style={{ marginBottom: 12 }}>
        <div className="section-box-title">💰 Il tuo saldo</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 4px',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 4 }}>
              Credito disponibile
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--gold-light)', lineHeight: 1 }}>
              €{balance}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 6 }}>
              Guadagnato da {referralStats?.successfulReferrals || 0} referral confermati
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(200,168,75,0.12)',
            border: '1.5px solid rgba(200,168,75,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>💎</div>
        </div>
        {balance > 0 && (
          <div style={{
            marginTop: 8, padding: '10px 14px',
            background: 'rgba(200,168,75,0.08)',
            border: '1px solid rgba(200,168,75,0.20)',
            borderRadius: 12, fontSize: 12, color: 'var(--gold-light)',
          }}>
            💡 Il tuo saldo viene scalato automaticamente al prossimo ordine confermato.
          </div>
        )}
      </div>

      {/* ── Referral code ── */}
      <div className="section-box" style={{ marginBottom: 12 }}>
        <div className="section-box-title">🎟️ Il tuo codice referral</div>

        <div style={{
          background: 'rgba(200,168,75,0.10)',
          border: '1px solid rgba(200,168,75,0.28)',
          borderRadius: 14, padding: '16px',
          textAlign: 'center', marginTop: 12,
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: 3,
            color: 'var(--gold-light)', fontFamily: 'monospace',
          }}>
            {referralCode}
          </div>

          <button
            id="copy-btn"
            onClick={copyReferralCode}
            style={{
              marginTop: 14, padding: '10px 24px',
              background: 'var(--gold-light)', color: '#000',
              border: 'none', borderRadius: 999,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            📋 Copia codice
          </button>

          {/* Stats row */}
          <div style={{
            marginTop: 18, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-around',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>
                {referralStats?.successfulReferrals || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>Amici</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-light)' }}>
                €{referralStats?.totalEarned || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>Guadagnati</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 12, lineHeight: 1.6 }}>
          Condividi il tuo codice — chi lo usa ottiene il <strong style={{ color: 'var(--gold-light)' }}>10% di sconto</strong>, tu ricevi <strong style={{ color: 'var(--gold-light)' }}>€10 di credito</strong> per ogni ordine confermato.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-num">{orders.length}</div>
            <div className="stat-label">ORDINI</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{referralStats?.successfulReferrals || 0}</div>
            <div className="stat-label">REFERRAL</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" style={{ color: 'var(--gold-light)' }}>€{balance}</div>
            <div className="stat-label">SALDO</div>
          </div>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="section-box" style={{ marginBottom: 12 }}>
        <div className="section-box-title">🔗 Links</div>
        {LINKS.map(link => (
          <a key={link.label} href={link.url} className="link-row" target="_blank" rel="noreferrer">
            <span className="link-icon">{link.icon}</span>
            <span className="link-label">{link.label}</span>
          </a>
        ))}
      </div>

      {/* ── Notifications ── */}
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
