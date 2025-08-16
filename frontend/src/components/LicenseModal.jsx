import React, { useMemo, useState } from 'react';

const FALLBACK = {
  mp3: 3999,
  wav: 7999,
  premium_wav: 9999,
  premium_wav_stems: 25000,
  unlimited: 19999,
  unlimited_stems: 35000,
  exclusive: null
};

const ORDER_DEFAULT = [
  'mp3','wav','premium_wav','premium_wav_stems','unlimited','unlimited_stems','exclusive'
];

const LABEL = {
  standard: { title: 'Standard', sub: 'MP3' },
  mp3: { title: 'Mp3 (100,000 Streams Limit)', sub: 'MP3' },
  wav: { title: 'Wav (250,000 Streams Limit)', sub: 'MP3 AND WAV' },
  premium_wav: { title: 'Premium Wav (500,000 Streams Limit)', sub: 'MP3 AND WAV' },
  premium_wav_stems: { title: 'Premium Wav + Stems', sub: 'MP3, WAV AND STEMS' },
  unlimited: { title: 'Unlimited (Unlimited Streams)', sub: 'MP3 AND WAV' },
  unlimited_stems: { title: 'Unlimited + Stems', sub: 'MP3, WAV AND STEMS' },
  exclusive: { title: 'Exclusive', sub: 'MP3, WAV AND STEMS' }
};

const fmt = (cents) =>
  (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export default function LicenseModal({ open, track, onClose, onChoose }) {
  if (!open) return null;

  const options = useMemo(() => {
    const p = (track?.pricing && typeof track.pricing === 'object') ? track.pricing : FALLBACK;
    const order = track?.licenseOrder?.length ? track.licenseOrder : ORDER_DEFAULT;
    return order
      .filter(k => p[k] !== undefined)
      .map(k => ({ key: k, priceCents: p[k] }));
  }, [track]);

  const [openKey, setOpenKey] = useState(null);

  const handleChoose = (key, priceCents) => {
    if (priceCents == null) return;
    onChoose?.({ license: key, priceCents });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--light license-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="license-modal__grid">
            
          {/* LEFT */}
          <div className="license-left">
            <div className="cover-wrap">
              <img
                className="license-cover"
                src={track?.coverUrl || 'https://placehold.co/320x320?text=Cover'}
                alt={track?.title}
              />
              <button className="cover-play" aria-label="Play preview">▶</button>
            </div>
            <div className="left-meta">
              <div className="left-title">{track?.title || 'Untitled'}</div>
              <div className="left-artist">{track?.artist || track?.owner?.displayName || 'Artist'}</div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="license-right">
            <h2 className="license-heading">Choose a license</h2>

            <div className="license-cards">
              {options.map(({ key, priceCents }) => {
                const label = LABEL[key] || { title: key.toUpperCase(), sub: '' };
                const isOpen = openKey === key;
                return (
                  <div key={key} className={`license-card ${isOpen ? 'license-card--open' : ''}`}>
                    <div className="card-top">
                      <div className="card-titles">
                        <div className="card-title">{label.title}</div>
                        <div className="card-sub">{label.sub}</div>
                      </div>
                      {priceCents == null ? (
                        <button className="btn btn--ghost" disabled title="Offers coming soon">
                          MAKE OFFER
                        </button>
                      ) : (
                        <button className="btn btn--cta" onClick={() => handleChoose(key, priceCents)}>
                          <span className="btn-cart" aria-hidden>🛒</span> {fmt(priceCents)}
                        </button>
                      )}
                    </div>

                    <button
                      className="card-toggle"
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      aria-expanded={isOpen}
                    >
                      <span className={`chev ${isOpen ? 'chev--open' : ''}`}>⌄</span>
                      Show features
                    </button>

                    <div className="card-features">
                      <ul>
                        <li>High-quality audio files</li>
                        <li>Non-exclusive commercial use</li>
                        <li>Streaming & monetization allowed (within tier limits)</li>
                        <li>Credit producer</li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
