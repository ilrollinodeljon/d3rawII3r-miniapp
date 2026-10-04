import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import SupportPage from './pages/SupportPage';
import ProfilePage from './pages/ProfilePage';
import WorkWithUsPage from './pages/WorkWithUsPage';
import BottomNav from './components/BottomNav';
import Topbar from './components/Topbar';

export default function App() {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cart = useStore(s => s.cart);

  const bgVideoRef = useRef(null);

  const navigate = (page, data) => {
    setStack(s => [...s, { tab, selectedProduct }]);
    if (page === 'product') setSelectedProduct(data);
    setTab(page);
  };

  const goBack = () => {
    const prev = stack[stack.length - 1];
    if (prev) {
      setStack(s => s.slice(0, -1));
      setTab(prev.tab);
      setSelectedProduct(prev.selectedProduct);
    }
  };

  const changeTab = (t) => {
    setTab(t);
    setStack([]);
    setSelectedProduct(null);
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
    }

    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
  }, []);

  // Deep-link from bot buttons: ?page=shop | support | work-with-us
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (!page) return;

    if (page === 'shop' || page === 'support') {
      changeTab(page);
    } else if (page === 'work-with-us') {
      navigate('work-with-us');
    }

    // Only drop the ?page=... query string — keep the URL hash intact.
    // Telegram delivers the Mini App's launch data (what initData is built
    // from) via the hash (#tgWebAppData=...). Wiping it here doesn't break
    // the CURRENT session (Telegram.WebApp.initData is already cached in
    // memory from the initial load), but it silently breaks any LATER full
    // page reload in this session — including the pull-to-refresh gesture
    // below — since that reloads the page at whatever URL is currently in
    // the address bar. Reload after the hash was stripped = a fresh page
    // load with no launch data = initData comes back empty for the rest
    // of that session, which is exactly what was breaking order submission.
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  }, []);

  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.play().catch(() => {});
    }
  }, [tab]);

  // ── Pull-to-refresh, safe version ──────────────────────────────────────
  // The previous implementation called window.location.reload() on this
  // gesture. That's what was silently breaking orders: a full page reload
  // re-launches the WebView from whatever's currently in the address bar,
  // and Telegram's signed initData is only guaranteed present on the
  // ORIGINAL launch URL — a reload can lose it for the rest of the
  // session, and on some platforms a full navigation like this can be
  // treated as leaving the Mini App entirely rather than refreshing it.
  //
  // This version never touches the URL or reloads the page. "Refresh"
  // here means re-syncing cart/orders/notifications/checkoutData/balance
  // from Telegram CloudStorage — the actual data this app can meaningfully
  // refresh without blowing away its own session.
  //
  // Implemented once here (not per-page) because every "page" in this app
  // renders inside the same #main-scroll container below — they all get
  // this for free with no per-page code needed.
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullDistanceRef = useRef(0);
  const pullStartY = useRef(null);

  const doRefresh = async () => {
    setRefreshing(true);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    useStore.getState().loadAllData();
    await new Promise(r => setTimeout(r, 500)); // keep the spinner visible briefly, not an instant flash
    setRefreshing(false);
    pullDistanceRef.current = 0;
    setPullDistance(0);
  };

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll');
    if (!scrollContainer) return;

    const PULL_THRESHOLD = 70;
    const PULL_MAX = 100;

    const handleTouchStart = (e) => {
      pullStartY.current = scrollContainer.scrollTop <= 0 ? e.touches[0].clientY : null;
    };

    const handleTouchMove = (e) => {
      if (pullStartY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - pullStartY.current;
      if (dy > 0 && scrollContainer.scrollTop <= 0) {
        const next = Math.min(dy * 0.5, PULL_MAX); // damped, elastic feel
        pullDistanceRef.current = next;
        setPullDistance(next);
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (pullStartY.current === null) return;
      pullStartY.current = null;
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        doRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    // passive: true throughout — we only ever read touch positions, never
    // preventDefault, so native scrolling stays completely untouched.
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refreshing]);

  const renderPage = () => {
    switch (tab) {
      case 'home': return <HomePage onNavigate={navigate} onTabChange={changeTab} />;
      case 'shop': return <ShopPage onNavigate={navigate} />;
      case 'product': return <ProductPage product={selectedProduct} onBack={goBack} />;
      case 'work-with-us': return <WorkWithUsPage onBack={goBack} />;
      case 'cart': return <CartPage />;
      case 'orders': return <OrdersPage />;
      case 'support': return <SupportPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage onNavigate={navigate} onTabChange={changeTab} />;
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <video
        ref={bgVideoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.95,
          filter: 'brightness(0.78)',
          pointerEvents: 'none',
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <Topbar
        onBack={stack.length > 0 ? goBack : null}
        onSupport={() => changeTab('support')}
        onProfile={() => changeTab('profile')}
      />

      <div
        id="main-scroll"
        style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '80px',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y',
        }}
      >
        {renderPage()}
      </div>

      {(pullDistance > 0 || refreshing) && (
        <div
          style={{
            position: 'fixed',
            top: 66,
            left: '50%',
            transform: `translateX(-50%) scale(${refreshing ? 1 : Math.min(0.5 + pullDistance / 140, 1)})`,
            zIndex: 40,
            opacity: refreshing ? 1 : Math.min(pullDistance / 70, 1),
            pointerEvents: 'none',
            transition: pullDistance === 0 && !refreshing ? 'opacity 0.2s ease, transform 0.2s ease' : 'none',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              animation: refreshing ? 'pull-refresh-spin 0.7s linear infinite' : 'none',
              transform: refreshing ? 'none' : `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pull-refresh-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <BottomNav
        active={['home', 'shop', 'cart', 'orders', 'support', 'profile'].includes(tab) ? tab : 'home'}
        onChange={changeTab}
        cartCount={cart.length}
      />
    </div>
  );
}
