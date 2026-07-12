// Sends order info to your Telegram group via the Bot API
// Bot token and chat ID come from environment variables

const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_ORDER_CHAT_ID;

async function tgPost(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.description || `Telegram ${method} failed (${res.status})`);
  }
  return res.json();
}

export async function sendOrderToTelegram(orderData) {
  const {
    user,
    cart,
    total,
    subtotal,
    delivery,
    courier,
    address,
    location,
    payment,
    notes,
    preferredDate,
    // discount fields — support both old and new key names
    discount,        // old: plain code string
    discountCode,    // new
    discountAmount,  // new
  } = orderData;

  // ── Resolve discount display ────────────────────────────────────────
  const code   = discountCode || discount || null;
  const saving = discountAmount != null ? discountAmount : null;

  // ── Cart lines ──────────────────────────────────────────────────────
  // Support both old (item.grams) and new (item.qty) quantity keys
  const cartLines = cart.map(item => {
    const qty    = item.qty ?? item.grams ?? '?';
    const unit   = item.unit ?? 'g';
    const strain = item.strain ? ` [${item.strain}]` : '';
    const emoji  = item.emoji  ? ` ${item.emoji}`    : '';
    return `  • ${item.name}${emoji}${strain} — ${qty}${unit}`;
  }).join('\n');

  // ── Address block ───────────────────────────────────────────────────
  const addressLines = address && Object.keys(address).length
    ? Object.entries(address)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : null;

  // ── Discount block ──────────────────────────────────────────────────
  let discountBlock = '';
  if (code) {
    discountBlock = `🏷️ <b>Codice sconto:</b> <code>${code}</code>`;
    if (saving != null && saving > 0) {
      discountBlock += ` (-€${saving})`;
      if (subtotal) discountBlock += ` — Subtotale: €${subtotal}`;
    }
  }

  // ── Build message ───────────────────────────────────────────────────
  const parts = [
    `🛒 <b>NUOVO ORDINE — therawller</b>`,
    ``,
    `👤 <b>Cliente:</b>`,
    `  Nome: ${user?.first_name || ''} ${user?.last_name || ''}`.trimEnd(),
    `  Username: @${user?.username || 'N/A'}`,
    `  ID: <code>${user?.id || 'N/A'}</code>`,
    ``,
    `📦 <b>Prodotti:</b>`,
    cartLines,
    ``,
    `🚚 <b>Consegna:</b> ${delivery}${courier ? ` (${courier})` : ''}`,
    location
      ? `📍 <b>GPS:</b> <a href="https://maps.google.com/?q=${location.lat},${location.lng}">Apri su Google Maps</a>`
      : null,
    addressLines ? `📍 <b>Indirizzo:</b>\n${addressLines}` : null,
    preferredDate ? `📅 <b>Data preferita:</b> ${preferredDate}` : null,
    ``,
    `💳 <b>Pagamento:</b> ${payment || 'N/A'}`,
    discountBlock || null,
    notes ? `📝 <b>Note:</b> ${notes}` : null,
    ``,
    `💰 <b>TOTALE: €${total}</b>`,
  ]
    .filter(line => line !== null)   // remove null/skipped lines
    .join('\n');

  // ── Send text message ───────────────────────────────────────────────
  await tgPost('sendMessage', {
    chat_id:    CHAT_ID,
    text:       parts,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  // ── Send GPS pin if delivery with location ──────────────────────────
  if (location?.lat && location?.lng) {
    await tgPost('sendLocation', {
      chat_id:   CHAT_ID,
      latitude:  location.lat,
      longitude: location.lng,
    });
  }

  return true;
}
