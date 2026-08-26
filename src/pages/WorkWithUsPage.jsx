import { useState, useRef, useEffect } from 'react';
import { sendVendorApplication } from '../utils/vendorApplication';

// UploadSlot — a big dashed tile with a "+" when empty; once a file is
// picked it swaps to a thumbnail (image or video frame) with a small ×
// to clear it. Tapping the tile again (outside the ×) reopens the picker,
// so replacing a file doesn't require clearing it first.
function UploadSlot({ label, media, inputRef, onPick, onClear, accept, isVideo, aspect }) {
  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        position: 'relative',
        aspectRatio: aspect,
        borderRadius: 16,
        border: media ? '1px solid rgba(255,255,255,0.12)' : '1.5px dashed rgba(255,255,255,0.22)',
        background: media ? '#000' : 'rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={onPick}
        style={{ display: 'none' }}
      />

      {media ? (
        <>
          {isVideo ? (
            <video
              src={media.previewUrl}
              preload="metadata"
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={media.previewUrl}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
              border: 'none', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 15,
              lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
          <span style={{
            position: 'absolute', left: 8, bottom: 6, fontSize: 10.5, fontWeight: 700,
            color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}>
            {label}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 42, lineHeight: 1, color: 'var(--gold-light)', fontWeight: 300 }}>+</span>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 6, fontWeight: 600 }}>{label}</span>
        </>
      )}
    </div>
  );
}

export default function WorkWithUsPage({ onBack }) {
  const [photo1, setPhoto1] = useState(null); // { file, previewUrl }
  const [photo2, setPhoto2] = useState(null);
  const [video, setVideo] = useState(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const photo1Ref = useRef(null);
  const photo2Ref = useRef(null);
  const videoRef = useRef(null);

  // Telegram Back Button — same pattern as ProductPage.jsx
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !onBack) return;
    tg.BackButton.show();
    const handler = () => onBack();
    tg.BackButton.onClick(handler);
    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [onBack]);

  // Revoke object URLs on unmount so previews don't leak memory
  useEffect(() => {
    return () => {
      [photo1, photo2, video].forEach(m => m && URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFile = (current, setter) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter({ file, previewUrl: URL.createObjectURL(file) });
  };

  const clearSlot = (current, setter, inputRef) => () => {
    if (current) URL.revokeObjectURL(current.previewUrl);
    setter(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const ready = photo1 && photo2 && video;

  const handleSubmit = async () => {
    if (!ready || status === 'sending') return;
    setStatus('sending');
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      await sendVendorApplication({
        photos: [photo1.file, photo2.file],
        video: video.file,
        note,
        user: tgUser
      });
      setStatus('sent');
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error('sendVendorApplication failed:', err);
      setStatus('error');
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    }
  };

  return (
    <div className="page fade-up">
      <div className="container" style={{ paddingTop: 18 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30,
          lineHeight: 1,
          letterSpacing: 0.5,
          color: '#fff',
          margin: 0,
          marginBottom: 10
        }}>
          🤝 Lavora con noi
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14.5, lineHeight: 1.5, marginBottom: 22 }}>
          Hai un prodotto o degli articoli da fumatore? Carica qui sotto 2 foto e 1 video
          e verrai ricontattato entro 24h per verificare la possibilità di entrare in TR Shop.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <UploadSlot
            label="Foto 1"
            media={photo1}
            inputRef={photo1Ref}
            accept="image/*"
            aspect="1/1"
            onPick={pickFile(photo1, setPhoto1)}
            onClear={clearSlot(photo1, setPhoto1, photo1Ref)}
          />
          <UploadSlot
            label="Foto 2"
            media={photo2}
            inputRef={photo2Ref}
            accept="image/*"
            aspect="1/1"
            onPick={pickFile(photo2, setPhoto2)}
            onClear={clearSlot(photo2, setPhoto2, photo2Ref)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <UploadSlot
            label="Video"
            media={video}
            inputRef={videoRef}
            accept="video/*"
            isVideo
            aspect="16/9"
            onPick={pickFile(video, setVideo)}
            onClear={clearSlot(video, setVideo, videoRef)}
          />
        </div>

        <div className="section-box" style={{ marginBottom: 18 }}>
          <div className="section-box-title">✏️ Nota (opzionale)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Es. tipo di prodotto, quantità disponibile, dove ti trovi…"
            rows={3}
            style={{
              width: '100%',
              marginTop: 12,
              resize: 'none',
              background: 'rgba(20,20,20,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 12px',
              color: '#e5e5e5',
              fontSize: 13.5,
              fontFamily: 'inherit'
            }}
          />
        </div>

        {status === 'sent' ? (
          <div style={{
            padding: 16,
            textAlign: 'center',
            background: 'rgba(120,220,140,0.08)',
            border: '1px solid rgba(120,220,140,0.3)',
            borderRadius: 999,
            color: '#7ee08a',
            fontWeight: 700
          }}>
            ✓ Candidatura inviata — ti ricontattiamo entro 24h
          </div>
        ) : (
          <button
            className="btn btn-gold"
            onClick={handleSubmit}
            disabled={!ready || status === 'sending'}
          >
            {status === 'sending'
              ? 'Invio in corso…'
              : status === 'error'
                ? '⚠️ Invio non riuscito — riprova'
                : '📩 Invia candidatura'}
          </button>
        )}

        {!ready && status === 'idle' && (
          <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 12, marginTop: 10 }}>
            Carica 2 foto e 1 video per poter inviare la candidatura.
          </p>
        )}
      </div>
    </div>
  );
}
