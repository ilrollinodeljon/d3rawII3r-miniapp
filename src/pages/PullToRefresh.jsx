// src/components/PullToRefresh.jsx
import { useState, useRef, useCallback } from 'react';

const THRESHOLD = 72;

export function PullToRefresh({ onRefresh, children }) {
  const [distance,   setDistance]   = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY   = useRef(null);
  const scrollEl = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = scrollEl.current;
    if (el && el.scrollTop > 0) return; // only when at top
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { setDistance(0); return; }
    // Elastic resistance
    const d = Math.min(Math.sqrt(dy) * 6.5, THRESHOLD + 24);
    setDistance(d);
    if (dy > 6) e.preventDefault(); // stops Telegram closing on downward drag
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (distance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setDistance(THRESHOLD * 0.55);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
      try { await onRefresh?.(); } catch {}
      setRefreshing(false);
    }
    setDistance(0);
    startY.current = null;
  }, [distance, refreshing, onRefresh]);

  const progress = Math.min(distance / THRESHOLD, 1);

  return (
    <div
      ref={scrollEl}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehaviorY: 'contain',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div style={{
        height: distance > 0 ? distance : 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: distance === 0 ? 'height 0.28s cubic-bezier(.22,.68,0,1.2)' : 'none',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          border: `2.5px solid rgba(244,197,66,0.20)`,
          borderTopColor: progress >= 1 ? '#F4C542' : `rgba(244,197,66,${progress})`,
          transform: refreshing
            ? 'scale(1)'
            : `rotate(${progress * 280}deg) scale(${0.45 + progress * 0.55})`,
          animation: refreshing ? 'ptr-spin 0.65s linear infinite' : 'none',
          opacity: Math.min(progress * 1.8, 1),
          transition: refreshing ? 'none' : 'opacity 0.08s',
        }} />
      </div>

      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>

      {children}
    </div>
  );
}
