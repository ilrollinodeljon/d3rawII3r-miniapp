import { useState } from 'react';

export default function Topbar({ onBack, onSupport, onProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: 56,
      paddingTop: 'env(safe-area-inset-top)',
      background: '#000000',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    }}>

      {/* ── Left: round arrow back OR logo ── */}
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s, transform 0.1s',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
          onPointerUp={e   => e.currentTarget.style.transform = 'scale(1)'}
          onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ‹
        </button>
      ) : (
        <img
          src="/logo-badge.png"
          alt="logo"
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* ── Centre: title ── */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 700, letterSpacing: 2,
          color: '#ffffff',
        }}>
          THE RAWLLER SHOP
        </h2>
      </div>

      {/* ── Right: three-dot menu ── */}
      <button
        onClick={() => setMenuOpen(v => !v)}
        style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'none', border: 'none',
          color: '#fff', fontSize: 24, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >···</button>

      {/* ── Dropdown ── */}
      {menuOpen && (
        <>
          {/* invisible overlay to close on outside tap */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1500 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 64, right: 12,
            background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            boxShadow: '0 8px 25px rgba(0,0,0,0.55)',
            zIndex: 2000, minWidth: 170, overflow: 'hidden',
          }}>
            {[
              { icon: '💬', label: 'Supporto', cb: onSupport },
              { icon: '👤', label: 'Profilo',  cb: onProfile  },
            ].map(({ icon, label, cb }) => (
              <button key={label}
                onClick={() => { setMenuOpen(false); cb?.(); }}
                style={{
                  width: '100%', padding: '15px 20px',
                  textAlign: 'left', background: 'none', border: 'none',
                  borderBottom: label === 'Supporto' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: '#fff', fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >{icon} {label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
