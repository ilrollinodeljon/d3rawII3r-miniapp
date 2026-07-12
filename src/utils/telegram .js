const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_ORDER_CHAT_ID;

async function tgPost(method, body) {
  // Debug: log what we're sending
  console.log(`[Telegram] ${method}`, { 
    botToken: BOT_TOKEN ? `${BOT_TOKEN.slice(0,8)}...` : 'MISSING',
    chatId: CHAT_ID || 'MISSING',
    body 
  });

  if (!BOT_TOKEN) throw new Error('VITE_BOT_TOKEN is not set in .env');
  if (!CHAT_ID)   throw new Error('VITE_ORDER_CHAT_ID is not set in .env');

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ ok: false, description: 'Non-JSON response' }));

  console.log(`[Telegram] ${method} response:`, data);

  if (!data.ok) {
    throw new Error(data.description || `Telegram ${method} failed (${res.status})`);
  }
  return data;
}

export async function sendOrderToTelegram(orderData) {
  const {
    user, cart, total, subtotal,
    delivery, courier, address, location,
    payment, notes, preferredDate,
    discount, discountCode, discountAmount,
  } = orderData;

  const code   = discountCode || discount || null;
  const saving = discountAmount ?? null;

  const cartLines = cart.map(item => {
    const qty  = item.qty ?? item.grams ?? '?';
    const unit = item.unit ?? 'g';
    return `  • ${item.name}${item.emoji ? ' ' + item.emoji : ''}${item.strain ? ` [${item.strain}]` : ''} — ${qty}${unit}`;
  }).join('\n');

  const addressLines = address && Object.keys(address).length
    ? Object.entries(address).filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v}`).join('\n')
    : null;

  const discountBlock = code
    ? `🏷️ Codice sconto: ${code}${saving ? ` (-€${saving})` : ''}${subtotal ? ` — Subtotale: €${subtotal}` : ''}`
    : null;

  const parts = [
    `🛒 NUOVO ORDINE — therawller`,
    ``,
    `👤 Cliente:`,
    `  Nome: ${(user?.first_name || '') + ' ' + (user?.last_name || '')}`.trimEnd(),
    `  Username: @${user?.username || 'N/A'}`,
    `  ID: ${user?.id || 'N/A'}`,
    ``,
    `📦 Prodotti:`,
    cartLines,
    ``,
    `🚚 Consegna: ${delivery}${courier ? ` (${courier})` : ''}`,
    location ? `📍 GPS: https://maps.google.com/?q=${location.lat},${location.lng}` : null,
    addressLines ? `📍 Indirizzo:\n${addressLines}` : null,
    preferredDate ? `📅 Data preferita: ${preferredDate}` : null,
    ``,
    `💳 Pagamento: ${payment || 'N/A'}`,
    discountBlock,
    notes ? `📝 Note: ${notes}` : null,
    ``,
    `💰 TOTALE: €${total}`,
  ].filter(l => l !== null).join('\n');

  // Send plain text (no HTML parse_mode) — avoids any HTML parsing errors
  await tgPost('sendMessage', {
    chat_id: CHAT_ID,
    text: parts,
    disable_web_page_preview: true,
  });

  if (location?.lat && location?.lng) {
    await tgPost('sendLocation', {
      chat_id:   CHAT_ID,
      latitude:  location.lat,
      longitude: location.lng,
    });
  }

  return true;
}
