import React, { useMemo, useState } from 'react';
import LicenseModal from './LicenseModal.jsx';
import { useCart } from './cart/CartProvider.jsx';

const DEFAULT_PRICE = 2999; // cents

export default function TrackCard({ track }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => new Audio(track?.audioUrl));

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

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="track-row">
      {/* Cover + Play/Pause Button */}
      <div className="track-row__cover-wrapper">
        <img
          className="track-row__cover"
          src={track.coverUrl || 'https://placehold.co/300x300?text=Cover'}
          alt={track.title}
        />
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      {/* Metadata */}
      <div className="track-row__meta">
        <div className="track-row__title">{track.title}</div>
        <div className="track-row__sub">#{track.genre || 'Unknown'}</div>
      </div>

      <div className="track-row__spacer" />

      {/* Add Button */}
      <button className="btn-add" onClick={() => setOpen(true)}>ADD</button>

      {/* License Modal */}
      <LicenseModal
        open={open}
        track={{ ...track, pricing: track.pricing || { standard: priceCents } }}
        onClose={() => setOpen(false)}
        onChoose={onChoose}
      />
    </div>
  );
}
