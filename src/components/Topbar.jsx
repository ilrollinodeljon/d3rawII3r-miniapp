import { useState } from 'react';

export default function Topbar({ onBack, backLabel = '← Indietro', onSupport, onProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div 
      className="topbar" 
      style={{ 
        position: 'fixed',        // ← Fixed on top
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,             // High z-index
        height: 56,
        background: '#000000',    // Pure solid black
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
      }}
    >
      {/* Back Button or Logo */}
      {onBack ? (
        <button 
          className="topbar-back" 
          onClick={onBack}
          style={{ marginRight: 12, fontSize: 16, color: '#C8A84B' }}
        >
          {backLabel}
        </button>
      ) : (
        <img
          src="/logo-badge.png"
          alt="logo"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            objectFit: 'cover',
            marginRight: 12,
            flexShrink: 0,
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Title Area */}
      <div 
        className="topbar-title" 
        style={{ 
          flex: 1, 
          textAlign: 'center',
          paddingRight: onBack ? 0 : 50,
        }}
      >
        <h2 style={{ 
          margin: 0, 
          fontFamily: 'var(--font-display)',
          fontSize: 24, 
          fontWeight: 700,
          letterSpacing: 2,
          color: '#ffffff'
        }}>
          THE RAWLLER SHOP
        </h2>
      </div>

      {/* Three Dots Button */}
      <button 
        className="topbar-menu" 
        onClick={toggleMenu}
        style={{ 
          zIndex: 101,
          fontSize: 28,
          lineHeight: 1,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          background: 'none',
          border: 'none',
        }}
      >
        ···
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: '68px',
          right: '12px',
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
          zIndex: 2000,
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
              color: '#fff',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
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
              color: '#fff',
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

      {/* Overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1500,
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
