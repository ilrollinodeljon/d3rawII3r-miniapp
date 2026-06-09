// Sends order info to your Telegram group via the Bot API
// Bot token and chat ID come from environment variables

const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_ORDER_CHAT_ID;

export async function sendOrderToTelegram(orderData) {
  const { user, cart, delivery, courier, address, payment, notes, discount, total } = orderData;

  const cartLines = cart.map(item => {
    return `  • ${item.name}${item.emoji ? ' ' + item.emoji : ''}${item.strain ? ` [${item.strain}]` : ''} — ${item.grams}g`;
  }).join('\n');

  const addressLines = Object.entries(address)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const message = `
🛒 <b>NUOVO ORDINE — therawller</b>

👤 <b>Cliente:</b>
  Nome: ${user?.first_name || ''} ${user?.last_name || ''}
  Username: @${user?.username || 'N/A'}
  ID: <code>${user?.id || 'N/A'}</code>

📦 <b>Prodotti:</b>
${cartLines}

🚚 <b>Consegna:</b> ${delivery}${courier ? ` (${courier})` : ''}
📍 <b>Indirizzo:</b>
${addressLines}

💳 <b>Pagamento:</b> ${payment}
${discount ? `🏷️ <b>Codice sconto:</b> ${discount}` : ''}
${notes ? `📝 <b>Note:</b> ${notes}` : ''}

💰 <b>TOTALE: €${total}</b>
`.trim();

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.description || 'Telegram API error');
  }
  return true;
}
