// utils/vendorApplication.js
//
// Sends a new vendor/product application (2 photos + 1 video) to the same
// Telegram group as real orders, as a single album (Bot API sendMediaGroup)
// so everything arrives together in one post. The previous version fired
// 3 separate calls (photo, photo, video+caption) — if the last one failed,
// the 2 photos would've already landed in the chat with zero context,
// since the applicant info/note was only attached to the video message.
//
// Reuses the same VITE_BOT_TOKEN / VITE_ORDER_CHAT_ID env vars the rest of
// the app already has (see utils/telegram.js's sendOrderToTelegram). If you
// ever want applications to land in a *different* chat than real orders,
// add a VITE_APPLICATIONS_CHAT_ID env var and point CHAT_ID at that instead.

const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_ORDER_CHAT_ID;

function describeApplicant(user) {
  if (!user) return 'Utente sconosciuto (initData non disponibile)';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const handle = user.username ? `@${user.username}` : '(nessun username)';
  return `${name} ${handle} — id ${user.id}`.trim();
}

function api(method) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

// Telegram sometimes answers with HTTP 200 but a body of
// { ok: false, description: "..." } (e.g. an unsupported file type) —
// surface that description instead of a bare status code so a failed
// submission is actually debuggable from the console.
async function assertOk(res, label) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok || body?.ok === false) {
    const reason = body?.description || `HTTP ${res.status}`;
    throw new Error(`${label} failed: ${reason}`);
  }
  return body;
}

/**
 * @param {Object} params
 * @param {File[]} params.photos - exactly 2 photo Files
 * @param {File}   params.video  - 1 video File
 * @param {string} [params.note] - optional free-text note from the applicant
 * @param {Object} [params.user] - window.Telegram.WebApp.initDataUnsafe.user
 */
export async function sendVendorApplication({ photos, video, note, user }) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('VITE_BOT_TOKEN / VITE_ORDER_CHAT_ID non configurati');
  }
  if (!photos?.[0] || !photos?.[1] || !video) {
    throw new Error('Servono 2 foto e 1 video per inviare la candidatura');
  }

  const caption =
    `🆕 NUOVA CANDIDATURA FORNITORE\n` +
    `Da: ${describeApplicant(user)}` +
    (note?.trim() ? `\nNota: ${note.trim()}` : '');

  // One sendMediaGroup call = one album in the chat, all 3 files arriving
  // together, with the caption shown once for the whole group (attached to
  // the first item, which is Telegram's convention for albums).
  const fd = new FormData();
  fd.append('chat_id', CHAT_ID);
  fd.append('media', JSON.stringify([
    { type: 'photo', media: 'attach://photo0', caption },
    { type: 'photo', media: 'attach://photo1' },
    { type: 'video', media: 'attach://video0' },
  ]));
  fd.append('photo0', photos[0], photos[0].name || 'photo0.jpg');
  fd.append('photo1', photos[1], photos[1].name || 'photo1.jpg');
  fd.append('video0', video, video.name || 'video0.mp4');

  const res = await fetch(api('sendMediaGroup'), { method: 'POST', body: fd });
  await assertOk(res, 'sendMediaGroup');
}
