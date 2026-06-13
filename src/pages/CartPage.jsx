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
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const total = getCartTotal(cart);
  const isDelivery = delivery === 'delivery_pavia';
  const deliveryMethod = DELIVERY_METHODS.find(d => d.id === delivery);
  const courierObj = deliveryMethod?.couriers?.find(c => c.id === courier);
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

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
    ? [{ id: 'crypto', label: 'Crypto', icon: '₿' }, { id: 'cash', label: 'Cash', icon: '💵' }]
    : [{ id: 'crypto', label: 'Crypto', icon: '₿' }, { id: 'iban', label: 'IBAN/Bonifico', icon: '🏦' }];

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
        payment: availablePayments.find(p => p.id === payment)?.label,
        notes,
        discount,
        preferredDate,
      });
      addOrder({
        id: Date.now(), cart: [...cart], total,
        date: new Date().toISOString(), status: 'In attesa',
        delivery, address,
        preferredDate,
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
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={e => { e.target.src = 'https://placehold.co/64x64/141414/888?text=IMG'; }}
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name} {item.emoji}</div>
                      <div className="cart-item-sub">
                        {item.grams}g · {itemPrice ? `€${itemPrice}` : '—'}
                        {item.strain ? ` · ${item.strain}` : ''}
                      </div>
                      <div className="qty-stepper" style={{ marginTop: 10 }}>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (currentIndex <= 0) removeFromCart(item.productId, item.strain);
                            else updateQty(item.productId, item.strain, sizes[currentIndex - 1]);
                          }}
                        >−</button>
                        <span className="qty-val">{item.grams}g</span>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (currentIndex < sizes.length - 1)
                              updateQty(item.productId, item.strain, sizes[currentIndex + 1]);
                          }}
                          disabled={currentIndex >= sizes.length - 1}
                        >+</button>
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => removeFromCart(item.productId, item.strain)}>🗑️</button>
                  </div>
                );
              })}
            </div>

            <div className="spacer-16" />

            {/* Total */}
            <div className="total-row">
              <span className="total-label">Totale</span>
              <span className="total-value">{SHOP_CONFIG.currency}{total}</span>
            </div>

            <div className="spacer-16" />

            {/* Delivery */}
            <div className="section-box">
              <div className="section-box-title">🚚 Tipo di consegna</div>
              <div className="delivery-grid">
                {DELIVERY_METHODS.map(d => (
                  <div
                    key={d.id}
                    className={`delivery-option ${delivery === d.id ? 'active' : ''}`}
                    onClick={() => { setDelivery(d.id); updateCheckoutData({ delivery: d.id, payment: 'crypto' }); setPayment('crypto'); }}
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
  <span
    style={{
      padding: '12px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRight: 'none',
      borderRadius: '12px 0 0 12px'
    }}
  >
    @
  </span>

  <input
    className="field"
    style={{ borderRadius: '0 12px 12px 0', marginBottom: 0 }}
    placeholder="username Telegram"
    value={(address.telegram || '').replace('@', '')}
    onChange={e => setField('telegram', '@' + e.target.value.replace('@', ''))}
  />
</div>
                  </div>
                  <input className="field" placeholder="Numero di Telefono" type="tel" value={address.telefono || ''} onChange={e => setField('telefono', e.target.value)} />
                  <input className="field" placeholder="Via e numero civico" value={address.indirizzo || ''} onChange={e => setField('indirizzo', e.target.value)} />
                  <input className="field" placeholder="Città" value={address.citta || ''} onChange={e => setField('citta', e.target.value)} />
                </div>
              ) : courier === 'inpost' ? (
                <div className="field-group">
                  <div className="field-row">
                    <input className="field" placeholder="Nome" value={address.nome || ''} onChange={e => setField('nome', e.target.value)} />
                    <input className="field" placeholder="Cognome" value={address.cognome || ''} onChange={e => setField('cognome', e.target.value)} />
                  </div>
                  <input className="field" placeholder="Telefono" type="tel" value={address.telefono || ''} onChange={e => setField('telefono', e.target.value)} />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
  <span
    style={{
      padding: '12px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRight: 'none',
      borderRadius: '12px 0 0 12px'
    }}
  >
    @
  </span>

  <input
    className="field"
    style={{ borderRadius: '0 12px 12px 0', marginBottom: 0 }}
    placeholder="username Telegram"
    value={(address.telegram || '').replace('@', '')}
    onChange={e => setField('telegram', '@' + e.target.value.replace('@', ''))}
  />
</div>
                  <input className="field" placeholder="Nome/codice locker InPost" value={address.locker_name || ''} onChange={e => setField('locker_name', e.target.value)} />
                  <p className="field-hint">Es: MI-CENTRO-001</p>
                  <input className="field" placeholder="Indirizzo locker" value={address.locker_address || ''} onChange={e => setField('locker_address', e.target.value)} />
                  <p className="field-hint">Puoi trovare i locker su inpost.it/trova-locker</p>
                  <input className="field" placeholder="Email (per ricevuta InPost)" type="email" value={address.email || ''} onChange={e => setField('email', e.target.value)} />
                  <p className="field-hint">Necessaria per ricevere le notifiche del corriere</p>
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
              <div className="field-group">
                <input
                  type="date"
                  className="field"
                  value={preferredDate}
                  onChange={(e) => updatePreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // today onwards
                />
                <p className="field-hint">Scegli la data in cui preferisci ricevere l'ordine (soggetto a disponibilità)</p>
              </div>
            </div>

            {/* Payment */}
            <div className="section-box">
              <div className="section-box-title">💳 Metodo di pagamento</div>
              <div className="payment-grid">
                {availablePayments.map(m => (
                  <div
                    key={m.id}
                    className={`payment-option ${payment === m.id ? 'active' : ''}`}
                    onClick={() => { setPayment(m.id); updateCheckoutData({ payment: m.id }); }}
                  >
                    <div className="pay-icon">{m.icon}</div>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Total recap */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13 }}>💰</span>
              <span style={{ fontWeight: 700 }}>Totale: </span>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 18 }}>{SHOP_CONFIG.currency}{total}</span>
            </div>

            {/* Notes */}
            <textarea
              className="field"
              placeholder="Note per l'ordine (opzionale)..."
              rows={3}
              style={{ resize: 'none', marginBottom: 12 }}
              value={notes}
              onChange={e => { setNotes(e.target.value); updateCheckoutData({ notes: e.target.value }); }}
            />

            {/* Discount code */}
            <div className="discount-row" style={{ marginBottom: 16 }}>
              <input
                className="field"
                placeholder="CODICE SCONTO"
                value={discount}
                onChange={e => { setDiscount(e.target.value); updateCheckoutData({ discount: e.target.value }); }}
              />
              <button className="apply-btn">Applica</button>
            </div>

            {error && <p className="error-text" style={{ marginBottom: 12 }}>⚠️ {error}</p>}

            <button
              className="btn btn-gold"
              onClick={handleSubmit}
              disabled={sending || cart.length === 0}
            >
              {sending ? '⏳ Invio in corso...' : '🛒 Invia Ordine'}
            </button>

            <div className="spacer-20" />
          </>
        )}
      </div>
    </div>
  );
}