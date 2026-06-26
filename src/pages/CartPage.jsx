import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import { useStore, getCartTotal, getPriceForGrams } from '../store';
import { DELIVERY_METHODS, SHOP_CONFIG } from '../config';
import { sendOrderToTelegram } from '../utils/telegram';

export default function CartPage() {
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const clearCart = useStore(s => s.clearCart);
  const addOrder = useStore(s => s.addOrder);
  const checkoutData = useStore(s => s.checkoutData);
  const updateCheckoutData = useStore(s => s.updateCheckoutData);

  const [delivery, setDelivery] = useState(checkoutData.delivery);
  const [courier, setCourier] = useState(checkoutData.courier);
  const [payment, setPayment] = useState(checkoutData.payment);
  const [address, setAddress] = useState(checkoutData.address || {});
  const [notes, setNotes] = useState(checkoutData.notes || '');
  const [discount, setDiscount] = useState(checkoutData.discount || '');
  const [preferredDate, setPreferredDate] = useState(checkoutData.preferredDate || '');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // === VERIFICATION STATES ===
  const [isVerified, setIsVerified] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [verificationVideo, setVerificationVideo] = useState(null);

  const requestLocation = () => {
    if (!navigator.geolocation) { 
      setError('Geolocalizzazione non supportata.'); 
      return; 
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          label = d.display_name?.split(',').slice(0, 3).join(', ') || label;
        } catch {}
        setLocation({ lat, lng, label });
        setLocating(false);
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
      },
      (err) => {
        setLocating(false);
        setError(err.code === 1 ? 'Permesso posizione negato. Abilitalo nelle impostazioni.' : 'Impossibile ottenere la posizione. Riprova.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const total = getCartTotal(cart);
  const isDelivery = delivery === 'delivery_pavia';
  const deliveryMethod = DELIVERY_METHODS.find(d => d.id === delivery);
  const courierObj = deliveryMethod?.couriers?.find(c => c.id === courier);
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = weekdays[date.getDay()];
      const dayNum = date.getDate();
      const month = date.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
      const value = date.toISOString().split('T')[0];

      days.push({
        value,
        dayName,
        dayNum,
        month,
        isToday: i === 0
      });
    }
    return days;
  };

  const nextDays = getNextDays();

  useEffect(() => {
    setDelivery(checkoutData.delivery);
    setCourier(checkoutData.courier);
    setPayment(checkoutData.payment);
    setAddress(checkoutData.address || {});
    setNotes(checkoutData.notes || '');
    setDiscount(checkoutData.discount || '');
    setPreferredDate(checkoutData.preferredDate || '');
  }, [checkoutData]);

  const setField = (k, v) => {
    const newAddress = { ...address, [k]: v };
    setAddress(newAddress);
    updateCheckoutData({ address: newAddress });
  };

  const updatePreferredDate = (date) => {
    setPreferredDate(date);
    updateCheckoutData({ preferredDate: date });
  };

  const availablePayments = isDelivery
    ? [{ id: 'cash', label: 'Cash', icon: '💵' }, { id: 'crypto', label: 'Crypto', icon: '₿' }]
    : [{ id: 'crypto', label: 'Crypto', icon: '₿' }, { id: 'iban', label: 'IBAN/Bonifico', icon: '🏦' }];

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);

    if (type === 'front') setFrontImage({ file, preview });
    else if (type === 'back') setBackImage({ file, preview });
    else if (type === 'video') setVerificationVideo({ file, preview });

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  const removeFile = (type) => {
    if (type === 'front') {
      if (frontImage?.preview) URL.revokeObjectURL(frontImage.preview);
      setFrontImage(null);
    } else if (type === 'back') {
      if (backImage?.preview) URL.revokeObjectURL(backImage.preview);
      setBackImage(null);
    } else if (type === 'video') {
      if (verificationVideo?.preview) URL.revokeObjectURL(verificationVideo.preview);
      setVerificationVideo(null);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!isDelivery && total < SHOP_CONFIG.minOrderShipping) {
      setError(`Ordine minimo €${SHOP_CONFIG.minOrderShipping} per la spedizione.`);
      return;
    }


    setSending(true);
    setError('');
    try {
      await sendOrderToTelegram({
        user, cart, total,
        delivery: deliveryMethod?.label,
        courier: isDelivery ? null : courierObj?.label,
        address,
        location,
        payment: availablePayments.find(p => p.id === payment)?.label,
        notes,
        discount,
        preferredDate,
        verification: {
          isVerified,
          frontImage: frontImage?.file,
          backImage: backImage?.file,
          verificationVideo: verificationVideo?.file,
        }
      });
      addOrder({
        id: Date.now(), cart: [...cart], total,
        date: new Date().toISOString(), status: 'In attesa',
        delivery, address, preferredDate,
      });
      clearCart();
      setSuccess(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {
      setError("Errore nell'invio. Riprova o contatta il supporto.");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="page fade-up">
        <Topbar />
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 16, textAlign: 'center' }}>
            Ordine inviato!
          </h2>
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
            Verrai contattato al più presto per confermare l'ordine e i dettagli di pagamento.
          </p>
          <div className="spacer-20" />
          <button className="btn btn-gold" onClick={() => setSuccess(false)} style={{ maxWidth: 280 }}>
            Torna allo shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <h2 className="section-title">🛒 Carrello</h2>

        {cart.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p>Il carrello è vuoto</p>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map((item, i) => {
                const itemPrice = getPriceForGrams(item.prices, item.grams);
                const sizes = item.prices.map(p => p.grams).sort((a, b) => a - b);
                const currentIndex = sizes.indexOf(item.grams);
                return (
                  <div key={i} className="cart-item">
                    <img src={item.image} alt={item.name} onError={e => { e.target.src = 'https://placehold.co/64x64/141414/888?text=IMG'; }} />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name} {item.emoji}</div>
                      <div className="cart-item-sub">
                        {item.grams}g · {itemPrice ? `€${itemPrice}` : '—'}
                        {item.strain ? ` · ${item.strain}` : ''}
                      </div>
                      <div className="qty-stepper" style={{ marginTop: 10 }}>
                        <button className="qty-btn" onClick={() => {
                          if (currentIndex <= 0) removeFromCart(item.productId, item.strain);
                          else updateQty(item.productId, item.strain, sizes[currentIndex - 1]);
                        }}>−</button>
                        <span className="qty-val">{item.grams}g</span>
                        <button className="qty-btn" onClick={() => {
                          if (currentIndex < sizes.length - 1) updateQty(item.productId, item.strain, sizes[currentIndex + 1]);
                        }} disabled={currentIndex >= sizes.length - 1}>+</button>
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => removeFromCart(item.productId, item.strain)}>🗑️</button>
                  </div>
                );
              })}
            </div>

            <div className="spacer-16" />

            <div className="total-row">
              <span className="total-label">Totale</span>
              <span className="total-value">{SHOP_CONFIG.currency}{total}</span>
            </div>

            <div className="spacer-20" />

            {/* Delivery */}
            <div className="section-box">
              <div className="section-box-title">🚚 Tipo di consegna</div>
              <div className="delivery-grid">
                {DELIVERY_METHODS.map(d => (
                  <div
                    key={d.id}
                    className={`delivery-option ${delivery === d.id ? 'active' : ''}`}
                    onClick={() => { 
                      setDelivery(d.id); 
                      const defaultPay = d.id === 'delivery_pavia' ? 'cash' : 'crypto'; 
                      updateCheckoutData({ delivery: d.id, payment: defaultPay }); 
                      setPayment(defaultPay); 
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</div>
                    {d.label}
                  </div>
                ))}
              </div>

              {deliveryMethod?.note && (
                <div className="notice" style={{ marginTop: 12 }}>
                  ⚠️ {deliveryMethod.note}
                </div>
              )}

              {!isDelivery && deliveryMethod?.couriers && (
                <>
                  <div className="spacer-12" />
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Scegli corriere</div>
                  <div className="courier-grid">
                    {deliveryMethod.couriers.map(c => (
                      <div
                        key={c.id}
                        className={`courier-option ${courier === c.id ? 'active' : ''}`}
                        onClick={() => { setCourier(c.id); updateCheckoutData({ courier: c.id }); }}
                      >
                        <div className="courier-icon">{c.icon}</div>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Address form */}
            <div className="section-box">
              <div className="section-box-title">
                {isDelivery ? `📍 ${deliveryMethod?.label}` : `${courierObj?.icon} ${courierObj?.label}`}
              </div>

              {isDelivery ? (
                <div className="field-group">
                  <div className="field-row">
                    <input className="field" placeholder="Nome e Cognome" value={address.nome || ''} onChange={e => setField('nome', e.target.value)} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>@</span>
                      <input className="field" style={{ borderRadius: '0 12px 12px 0', marginBottom: 0 }} placeholder="username Telegram" value={(address.telegram || '').replace('@', '')} onChange={e => setField('telegram', '@' + e.target.value.replace('@', ''))} />
                    </div>
                  </div>
                  <input className="field" placeholder="Numero di Telefono" type="tel" value={address.telefono || ''} onChange={e => setField('telefono', e.target.value)} />
                  <input className="field" placeholder="Via e numero civico" value={address.indirizzo || ''} onChange={e => setField('indirizzo', e.target.value)} />
                  <input className="field" placeholder="Città" value={address.citta || ''} onChange={e => setField('citta', e.target.value)} />

                  <button type="button" onClick={requestLocation} disabled={locating} style={{ width: '100%', marginTop: 4, padding: '14px 16px', borderRadius: 100, border: '2px solid', borderColor: location ? 'rgba(125,217,154,0.6)' : 'rgba(255,255,255,0.15)', background: location ? 'rgba(61,170,92,0.12)' : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: locating ? 'wait' : 'pointer', backdropFilter: 'blur(20px)', boxShadow: location ? 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 16px rgba(61,170,92,0.2)' : 'inset 0 1.5px 0 rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    {locating ? '⏳ Rilevamento...' : location ? '✅ Posizione condivisa' : '📍USA LA MIA POSIZIONE ATTUALE'}
                  </button>

                  {location && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid rgba(125,217,154,0.2)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5, flex: 1 }}>📍 {location.label}</div>
                      <button onClick={() => setLocation(null)} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: 12, cursor: 'pointer', flexShrink: 0, padding: 0 }}>✕</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="field-group">
                  <div className="field-row">
                    <input className="field" placeholder="Nome" value={address.nome || ''} onChange={e => setField('nome', e.target.value)} />
                    <input className="field" placeholder="Cognome" value={address.cognome || ''} onChange={e => setField('cognome', e.target.value)} />
                  </div>
                  <input className="field" placeholder="Telefono" type="tel" value={address.telefono || ''} onChange={e => setField('telefono', e.target.value)} />
                  <input className="field" placeholder="Indirizzo" value={address.indirizzo || ''} onChange={e => setField('indirizzo', e.target.value)} />
                  <div className="field-row">
                    <input className="field" placeholder="CAP" value={address.cap || ''} onChange={e => setField('cap', e.target.value)} />
                    <input className="field" placeholder="Città" value={address.citta || ''} onChange={e => setField('citta', e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Preferred Date */}
            <div className="section-box">
              <div className="section-box-title">📅 Data preferita di consegna</div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {nextDays.map((day) => (
                  <div key={day.value} className={`date-chip ${preferredDate === day.value ? 'active' : ''}`} onClick={() => updatePreferredDate(day.value)} style={{ minWidth: '78px', textAlign: 'center', padding: '14px 10px', borderRadius: '16px', border: '2px solid var(--border)', background: preferredDate === day.value ? 'var(--gold)' : 'var(--surface)', color: preferredDate === day.value ? '#000' : 'var(--text)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>{day.dayName}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 2px' }}>{day.dayNum}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{day.month}</div>
                    {day.isToday && <div style={{ fontSize: '10px', marginTop: 4, fontWeight: 600 }}>OGGI</div>}
                  </div>
                ))}
              </div>
              <p className="field-hint" style={{ marginTop: 12 }}>Seleziona il giorno preferito (soggetto a disponibilità)</p>
            </div>

            {/* Payment */}
            <div className="section-box">
              <div className="section-box-title">💳 Metodo di pagamento</div>
              <div className="payment-grid">
                {availablePayments.map(m => (
                  <div key={m.id} className={`payment-option ${payment === m.id ? 'active' : ''}`} onClick={() => { setPayment(m.id); updateCheckoutData({ payment: m.id }); }}>
                    <div className="pay-icon">{m.icon}</div>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

           {/* OPTIONAL VERIFICATION SECTION */}
            <div className="section-box" style={{ padding: '16px' }}>
              <div className="section-box-title">📄 Verifica Account</div>

              {(frontImage || backImage || verificationVideo) ? (
                <div>
                  <div className="notice" style={{ background: 'rgba(74,222,128,0.15)', borderColor: '#4ade80', color: '#4ade80', padding: '14px', borderRadius: 12, textAlign: 'center', fontWeight: 600 }}>
                    ✅ ACCOUNT VERIFICATO
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    {frontImage && (
                      <div style={{ position: 'relative', flex: 1 }}>
                        <img src={frontImage.preview} alt="Fronte" style={{ width: '100%', borderRadius: 12, border: '2px solid #4ade80' }} />
                        <button onClick={() => removeFile('front')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.85)', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 14 }}>✕</button>
                      </div>
                    )}
                    {backImage && (
                      <div style={{ position: 'relative', flex: 1 }}>
                        <img src={backImage.preview} alt="Retro" style={{ width: '100%', borderRadius: 12, border: '2px solid #4ade80' }} />
                        <button onClick={() => removeFile('back')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.85)', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 14 }}>✕</button>
                      </div>
                    )}
                    {verificationVideo && (
                      <div style={{ position: 'relative', flex: 1 }}>
                        <div style={{ height: 110, background: '#111', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #4ade80' }}>
                          🎥 Video caricato
                        </div>
                        <button onClick={() => removeFile('video')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.85)', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 14 }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-sub)', marginBottom: 12 }}>
                    Foto fronte e retro del documento di identità di chi ritira l'ordine e video selfie con doc visibile in mano (necessari solo al primo ordine con delivery)
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }} onClick={() => document.getElementById('front-upload').click()}>
                      <input id="front-upload" type="file" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e, 'front')} style={{ display: 'none' }} />
                      <div className="glass" style={{ height: '110px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>📸<br />Fronte</div>
                    </div>
                    <div style={{ flex: 1 }} onClick={() => document.getElementById('back-upload').click()}>
                      <input id="back-upload" type="file" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e, 'back')} style={{ display: 'none' }} />
                      <div className="glass" style={{ height: '110px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>📸<br />Retro</div>
                    </div>
                    <div style={{ flex: 1 }} onClick={() => document.getElementById('video-upload').click()}>
                      <input id="video-upload" type="file" accept="video/*" capture="environment" onChange={(e) => handleFileSelect(e, 'video')} style={{ display: 'none' }} />
                      <div className="glass" style={{ height: '110px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>🎥<br />Video</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="error-text" style={{ margin: '12px 0' }}>⚠️ {error}</p>}

            <button className="btn btn-gold" onClick={handleSubmit} disabled={sending || cart.length === 0}>
              {sending ? '⏳ Invio in corso...' : `🛒 Invia Ordine - €${total}`}
            </button>

            <div className="spacer-20" />
          </>
        )}
      </div>
    </div>
  );
}
