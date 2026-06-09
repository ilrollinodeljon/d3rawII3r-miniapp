import { useState } from 'react';
import Topbar from '../components/Topbar';

export default function SupportPage() {
  const [msg, setMsg] = useState('');

  const send = () => {
    if (!msg.trim()) return;
    // Open Telegram support chat
    window.Telegram?.WebApp?.openTelegramLink('https://t.me/your_support_username');
    setMsg('');
  };

  return (
    <div className="page fade-up">
      <Topbar />
      <div className="container">
        <h2 className="section-title">💬 Supporto</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
          Hai bisogno di aiuto? Scrivici un messaggio e ti risponderemo al più presto.
        </p>

        <div className="support-input-row">
          <input
            className="field"
            placeholder="Scrivi un messaggio..."
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="send-btn" onClick={send}>➤</button>
        </div>

        <div className="spacer-16" />

        <div className="section-box">
          <div className="section-box-title">📌 Info utili</div>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.7 }}>
            Gli ordini vengono processati entro 24h.<br />
            Per urgenze scrivi direttamente su Telegram.
          </p>
        </div>
      </div>
    </div>
  );
}
