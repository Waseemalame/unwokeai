import React, { useMemo, useState } from 'react';
import LicenseModal from './LicenseModal.jsx';
import { useCart } from './cart/CartProvider.jsx';

const DEFAULT_PRICE = 2999; // cents

export default function TrackCard({ track }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);

  const priceCents = useMemo(() => {
    const p = track?.pricing || {};
    return p.standard ?? p.mp3 ?? DEFAULT_PRICE;
  }, [track]);

  const onChoose = ({ license, priceCents }) => {
    add({
      trackId: track._id || track.audioUrl,
      title: track.title || 'Untitled',
      priceCents,
      license: license || 'standard'
    });
    setOpen(false);
  };

  return (
    <div className="track-row">
      <img
        className="track-row__cover"
        src={track.coverUrl || 'https://placehold.co/64x64?text=Cover'}
        alt={track.title}
      />
      <div className="track-row__meta">
        <div className="track-row__title">{track.title}</div>
        <div className="track-row__sub">#{track.genre || 'Unknown'}</div>
      </div>

      <div className="track-row__spacer" />

      <button className="btn-add" onClick={() => setOpen(true)}>ADD</button>

      <LicenseModal
        open={open}
        track={{ ...track, pricing: track.pricing || { standard: priceCents } }}
        onClose={() => setOpen(false)}
        onChoose={onChoose}
      />
    </div>
  );
}
