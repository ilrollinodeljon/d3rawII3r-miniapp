// utils/vendorApplication.js
//
// Sends a new vendor/product application (2 photos + 1 video) through the
// Worker's /api/vendor-application endpoint instead of calling Telegram
// directly from the browser.
//
// Why this changed: the old version needed VITE_BOT_TOKEN in the browser
// bundle to call Telegram itself, which means the bot token was sitting in
// plain text in every visitor's downloaded JS — extractable via DevTools by
// anyone, usable to post to the group (or anywhere else the bot is a
// member) as if it were the bot. It also trusted whatever user object the
// client handed it with zero verification, so identity was spoofable.
//
// Now: the Worker holds BOT_TOKEN as a private secret that's never shipped
// to any browser, and verifies Telegram's *signed* initData server-side
// (the real cryptographic check, not just reading initDataUnsafe) before
// trusting who's actually submitting, then relays to Telegram itself.

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://rawller-bot-worker.koshermalley.workers.dev';

/**
 * @param {Object} params
 * @param {File[]} params.photos - exactly 2 photo Files
 * @param {File}   params.video  - 1 video File
 * @param {string} [params.note] - optional free-text note from the applicant
 */
export async function sendVendorApplication({ photos, video, note }) {
  if (!photos?.[0] || !photos?.[1] || !video) {
    throw new Error('Servono 2 foto e 1 video per inviare la candidatura');
  }

  // The RAW, Telegram-signed initData string — the Worker verifies this
  // signature server-side before trusting anything about who sent it.
  // Deliberately NOT initDataUnsafe: that's just parsed client state with
  // no proof it wasn't tampered with, which is exactly what made the old
  // flow spoofable.
  const initData = window.Telegram?.WebApp?.initData || '';
  if (!initData) {
    throw new Error('initData non disponibile — apri la Mini App da Telegram');
  }

  const fd = new FormData();
  fd.append('initData', initData);
  fd.append('photo0', photos[0], photos[0].name || 'photo0.jpg');
  fd.append('photo1', photos[1], photos[1].name || 'photo1.jpg');
  fd.append('video0', video, video.name || 'video0.mp4');
  if (note?.trim()) fd.append('note', note.trim());

  const res = await fetch(`${WORKER_URL}/api/vendor-application`, {
    method: 'POST',
    body: fd,
  });

  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok || body?.ok === false) {
    throw new Error(body?.error || `Invio fallito: HTTP ${res.status}`);
  }
}
