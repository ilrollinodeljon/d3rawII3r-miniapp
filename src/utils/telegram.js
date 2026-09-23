// utils/telegram.js
//
// Sends order info through the Worker's /api/order endpoint instead of
// calling Telegram directly from the browser.
//
// Why this changed: the old version needed VITE_BOT_TOKEN in the browser
// bundle to call Telegram itself — the same exposure the vendor
// application flow had (see utils/vendorApplication.js). The Worker now
// holds BOT_TOKEN as a private secret and verifies Telegram's *signed*
// initData server-side before trusting who actually placed the order,
// then relays to Telegram using the exact same message format as before —
// so the auto-credit watcher's "Codice sconto: RAW<id>" matching keeps
// working unchanged.
//
// Call signature is unchanged: sendOrderToTelegram(orderData). Any
// orderData.user the caller still passes is accepted but ignored — the
// Worker derives the trusted buyer identity from verified initData
// instead, so nothing client-supplied about who's ordering is trusted.

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://rawller-bot-worker.koshermalley.workers.dev';

export async function sendOrderToTelegram(orderData) {
  const initData = window.Telegram?.WebApp?.initData || '';
  if (!initData) {
    throw new Error('initData non disponibile — apri la Mini App da Telegram');
  }

  const res = await fetch(`${WORKER_URL}/api/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, order: orderData }),
  });

  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok || body?.ok === false) {
    throw new Error(body?.error || `Invio ordine fallito: HTTP ${res.status}`);
  }

  return true;
}
