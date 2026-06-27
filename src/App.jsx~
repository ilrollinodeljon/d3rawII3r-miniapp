import { useState, useEffect } from 'react';
import { useStore } from './store';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import SupportPage from './pages/SupportPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';

export default function App() {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cart = useStore(s => s.cart);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
    }
    // Load all persisted data from Telegram CloudStorage
    useStore.getState().loadAllData();
  }, []);

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

  const renderPage = () => {
    switch (tab) {
      case 'home': return <HomePage onNavigate={navigate} onTabChange={changeTab} />;
      case 'shop': return <ShopPage onNavigate={navigate} />;
      case 'product': return <ProductPage product={selectedProduct} onBack={goBack} />;
      case 'cart': return <CartPage />;
      case 'orders': return <OrdersPage />;
      case 'support': return <SupportPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage onNavigate={navigate} onTabChange={changeTab} />;
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Looping Video Background - Visible on ALL pages */}
      <video
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
          opacity: 0.55,
          filter: 'brightness(0.78)',
          pointerEvents: 'none',
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
        {/* Optional GIF fallback */}
        {/* <img src="/bg.gif" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
      </video>

      {/* Ambient overlay (gold glow + vignette) */}
      <div className="bg-art" />

      {renderPage()}

      <BottomNav
        active={['home','shop','cart','orders','support','profile'].includes(tab) ? tab : 'home'}
        onChange={changeTab}
        cartCount={cart.length}
      />
    </div>
  );
}
