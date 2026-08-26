// utils/vendorApplication.js
//
// Sends a new vendor/product application (2 photos + 1 video) straight to
// Telegram, tagged so it reads clearly as an application and not an order.
// Reuses the same VITE_BOT_TOKEN / VITE_ORDER_CHAT_ID env vars the rest of
// the app already has (see utils/telegram.js's sendOrderToTelegram). If you
// want applications to land in a *different* chat than real orders, add a
// VITE_APPLICATIONS_CHAT_ID env var and point CHAT_ID at that instead.

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

  const caption =
    `🆕 NUOVA CANDIDATURA FORNITORE\n` +
    `Da: ${describeApplicant(user)}` +
    (note?.trim() ? `\nNota: ${note.trim()}` : '');

  // Photos go up first, plain. The video carries the caption and goes
  // last, so the whole submission reads as one block in the chat.
  for (const photo of photos) {
    const fd = new FormData();
    fd.append('chat_id', CHAT_ID);
    fd.append('photo', photo);
    const res = await fetch(api('sendPhoto'), { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`sendPhoto failed: ${res.status}`);
  }

  if (video) {
    const fd = new FormData();
    fd.append('chat_id', CHAT_ID);
    fd.append('video', video);
    fd.append('caption', caption);
    const res = await fetch(api('sendVideo'), { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`sendVideo failed: ${res.status}`);
  } else {
    // Defensive fallback — the page shouldn't allow submit without a video,
    // but if it ever does, don't let the caption get lost silently.
    const fd = new FormData();
    fd.append('chat_id', CHAT_ID);
    fd.append('text', caption);
    await fetch(api('sendMessage'), { method: 'POST', body: fd });
  }
}
