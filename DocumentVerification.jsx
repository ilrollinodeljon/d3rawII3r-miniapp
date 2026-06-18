// DocumentVerification.jsx
//
// ─── WIRING INTO CartPage.jsx ────────────────────────────────────────────────
//
//   import DocumentVerification from './DocumentVerification';
//
//   // Add alongside other checkout states:
//   const [docFront, setDocFront] = useState(null);
//   const [docBack,  setDocBack]  = useState(null);
//   const [docVideo, setDocVideo] = useState(null);
//
//   // Place in JSX after the date-picker section-box:
//   <DocumentVerification
//     docFront={docFront} setDocFront={setDocFront}
//     docBack={docBack}   setDocBack={setDocBack}
//     docVideo={docVideo} setDocVideo={setDocVideo}
//   />
//
//   // In sendOrderToTelegram, switch to FormData and attach files:
//   //   form.append('doc_front', docFront.file, docFront.name);
//   //   form.append('doc_back',  docBack.file,  docBack.name);
//   //   form.append('doc_video', docVideo.file, docVideo.name);
//   //   Use sendMediaGroup to bundle into one Telegram message.
//
// ─── HOW TO MANUALLY VERIFY A USER ─────────────────────────────────────────
//
//   The component calls: GET /api/verify-status?userId=<telegram_id>
//   Expected response:   { "verified": true }  or  { "verified": false }
//
//   To mark a user verified, add this command to your Telegram bot:
//
//     bot.command('verify', async (ctx) => {
//       const adminIds = [YOUR_ADMIN_TELEGRAM_ID];
//       if (!adminIds.includes(ctx.from.id)) return ctx.reply('❌ Non autorizzato');
//       const targetId = ctx.match.trim();
//       if (!targetId) return ctx.reply('Usa: /verify <user_id>');
//       await db.set(`verified:${targetId}`, 'true');
//       return ctx.reply(`✅ Utente ${targetId} verificato.`);
//     });
//
//   The Telegram user ID is included in every order message your bot sends.
//
//   Minimal Express endpoint:
//     app.get('/api/verify-status', async (req, res) => {
//       const val = await db.get(`verified:${req.query.userId}`);
//       res.json({ verified: val === 'true' });
//     });
//
// ────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react';

const VERIFY_STATUS_URL = '/api/verify-status'; // ← point to your backend

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const toDataURL = (file) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.readAsDataURL(file);
  });

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/* ─── single media slot ───────────────────────────────────────────────────── */
function MediaSlot({ label, sublabel, icon, accept, capture, value, onChange, isVideo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    const preview = isVideo ? URL.createObjectURL(file) : await toDataURL(file);
    onChange({ file, preview, name: file.name, size: file.size });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clear = (e) => {
    e.stopPropagation();
    if (value?.preview && isVideo) URL.revokeObjectURL(value.preview);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const filled = !!value;

  return (
    <div
      onClick={() => !filled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 16,
        border: '2px solid',
        borderColor: filled
          ? 'rgba(125,217,154,0.55)'
          : dragging
          ? 'var(--gold)'
          : 'var(--border)',
        background: filled
          ? 'rgba(61,170,92,0.08)'
          : dragging
          ? 'rgba(61,170,92,0.06)'
          : 'var(--surface2)',
        cursor: filled ? 'default' : 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
        minHeight: 148,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {filled ? (
        <>
          {isVideo ? (
            <video
              src={value.preview}
              controls
              playsInline
              muted
              style={{ width: '100%', height: 148, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={value.preview}
              alt={label}
              style={{ width: '100%', height: 148, objectFit: 'cover', display: 'block' }}
            />
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
            padding: '18px 10px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,0.75)',
              maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              ✅ {value.name} · {formatSize(value.size)}
            </span>
            <button
              onClick={clear}
              style={{
                background: 'rgba(255,100,100,0.18)', border: '1px solid rgba(255,100,100,0.35)',
                color: '#ff7b7b', borderRadius: 8, padding: '3px 9px',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cambia
            </button>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 30 }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
          {sublabel && (
            <div style={{ fontSize: 11, color: 'var(--text-sub)', lineHeight: 1.4 }}>{sublabel}</div>
          )}
          <div style={{
            marginTop: 4,
            padding: '6px 14px',
            borderRadius: 100,
            background: 'rgba(61,170,92,0.10)',
            border: '1px solid rgba(125,217,154,0.28)',
            color: 'var(--gold-light)',
            fontSize: 11, fontWeight: 700,
          }}>
            {isVideo ? '🎥 Registra / Carica' : '📷 Scatta / Carica'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── verified badge (collapsed state) ───────────────────────────────────── */
function VerifiedBadge() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      borderRadius: 16,
      border: '1.5px solid rgba(125,217,154,0.35)',
      background: 'rgba(61,170,92,0.07)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(61,170,92,0.18)',
        border: '1.5px solid rgba(125,217,154,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        ✅
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold-light)' }}>
          Account verificato
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 3 }}>
          Il tuo documento è già stato confermato
        </div>
      </div>
    </div>
  );
}

/* ─── loading skeleton ────────────────────────────────────────────────────── */
function VerifyLoader() {
  return (
    <div style={{
      height: 68, borderRadius: 16,
      background: 'var(--surface2)',
      border: '1.5px solid var(--border)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

/* ─── main export ─────────────────────────────────────────────────────────── */
export default function DocumentVerification({
  docFront, setDocFront,
  docBack,  setDocBack,
  docVideo, setDocVideo,
}) {
  // 'loading' | 'verified' | 'unverified'
  const [verifiedStatus, setVerifiedStatus] = useState('loading');
  const allDone = docFront && docBack && docVideo;

  useEffect(() => {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    if (!userId) {
      setVerifiedStatus('unverified'); // dev/browser preview — show form
      return;
    }

    fetch(`${VERIFY_STATUS_URL}?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setVerifiedStatus(data.verified ? 'verified' : 'unverified'))
      .catch(() => setVerifiedStatus('unverified')); // fail open
  }, []);

  return (
    <div className="section-box">
      {/* ── header ── */}
      <div className="section-box-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🪪</span>
        <span>Verifica account con il documento</span>

        {verifiedStatus === 'verified' && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            color: 'var(--gold-light)',
            background: 'rgba(61,170,92,0.12)',
            border: '1px solid rgba(125,217,154,0.3)',
            padding: '3px 9px', borderRadius: 100, letterSpacing: 0.5,
          }}>
            ✅ VERIFICATO
          </span>
        )}

        {verifiedStatus === 'unverified' && allDone && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            color: 'var(--gold-light)',
            background: 'rgba(61,170,92,0.12)',
            border: '1px solid rgba(125,217,154,0.3)',
            padding: '3px 9px', borderRadius: 100, letterSpacing: 0.5,
          }}>
            ✅ COMPLETO
          </span>
        )}
      </div>

      {/* ── body switches on status ── */}

      {verifiedStatus === 'loading' && <VerifyLoader />}

      {verifiedStatus === 'verified' && <VerifiedBadge />}

      {verifiedStatus === 'unverified' && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: -6, marginBottom: 14, lineHeight: 1.5 }}>
            Carica una foto del documento fronte/retro e un breve video selfie per completare la verifica.
          </p>

          {/* photo row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <MediaSlot
              label="Fronte"
              sublabel="Lato con foto e dati"
              icon="🪪"
              accept="image/*"
              capture="environment"
              value={docFront}
              onChange={setDocFront}
              isVideo={false}
            />
            <MediaSlot
              label="Retro"
              sublabel="Lato posteriore"
              icon="🔄"
              accept="image/*"
              capture="environment"
              value={docBack}
              onChange={setDocBack}
              isVideo={false}
            />
          </div>

          {/* video slot */}
          <div style={{ marginTop: 10 }}>
            <MediaSlot
              label="Video selfie di verifica"
              sublabel="Tieni il documento vicino al viso e pronuncia il tuo nome"
              icon="🤳"
              accept="video/*"
              capture="user"
              value={docVideo}
              onChange={setDocVideo}
              isVideo={true}
            />
          </div>

          {/* progress dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, alignItems: 'center' }}>
            {[
              { val: docFront, label: 'Fronte' },
              { val: docBack,  label: 'Retro' },
              { val: docVideo, label: 'Video' },
            ].map(({ val, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: val ? 'var(--gold-light)' : 'var(--border)',
                  transition: 'background 0.3s',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: val ? 'var(--gold-light)' : 'var(--text-sub)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p className="field-hint" style={{ marginTop: 10 }}>
            Opzionale ma consigliato · velocizza l'attivazione del tuo account
          </p>
        </>
      )}
    </div>
  );
}
