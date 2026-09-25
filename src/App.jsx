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

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll');
    if (!scrollContainer) return;

    let startY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      const scrollTop = scrollContainer.scrollTop;

      if (scrollTop <= 0 && startY < 100 && endY - startY > 130) {
        window.location.reload();
      }
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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

      <BottomNav
        active={['home', 'shop', 'cart', 'orders', 'support', 'profile'].includes(tab) ? tab : 'home'}
        onChange={changeTab}
        cartCount={cart.length}
      />
    </div>
  );
}
