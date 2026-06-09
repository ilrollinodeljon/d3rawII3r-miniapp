import { useState } from 'react';
import { SHOP_CONFIG } from '../config';

export default function Topbar({ onBack, backLabel = '← Indietro', onSupport, onProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="topbar" style={{ position: 'relative', zIndex: 100 }}>
      {onBack ? (
        <button className="topbar-back" onClick={onBack}>{backLabel}</button>
      ) : (
        <img
          src="/logo.png"
          alt="logo"
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="topbar-title">
        <h2>{SHOP_CONFIG.name}</h2>
        <p>{SHOP_CONFIG.subtitle}</p>
      </div>

      {/* Three Dots Button */}
      <button 
        className="topbar-menu" 
        onClick={toggleMenu}
        style={{ zIndex: 101 }}
      >
        ···
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: '64px',
          right: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          zIndex: 200,
          minWidth: '170px',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => { setMenuOpen(false); onSupport?.(); }}
            style={{
              width: '100%',
              padding: '16px 20px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            💬 Supporto
          </button>
          <button
            onClick={() => { setMenuOpen(false); onProfile?.(); }}
            style={{
              width: '100%',
              padding: '16px 20px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            👤 Profilo
          </button>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
