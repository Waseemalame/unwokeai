import { useEffect, useRef, useState, useMemo } from 'react';
import LicenseModal from './LicenseModal.jsx';
import { useCart } from './cart/CartProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

const DEFAULT_PRICE = 2999; // cents

export default function TrackCard({ track, isPlaying, onPlay, onPause }) {
  const { add } = useCart();
  const { getToken, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(track.likesCount);

  const audioRef = useRef(null);

  const priceCents = useMemo(() => {
    const p = track?.pricing || {};
    return p.standard ?? p.mp3 ?? DEFAULT_PRICE;
  }, [track]);

  const toggleLike = async () => {
    try {
      const token = await getToken();
      if (!token){
        // TODO: Prompt user to login/signup
        console.warn('User not authenticated, cannot like track');
        return;
      }
      const method = liked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/tracks/${track._id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  const onChoose = ({ license, priceCents }) => {
    add({
      trackId: track._id || track.audioUrl,
      title: track.title || 'Untitled',
      priceCents,
      license: license || 'standard'
    });
    setOpen(false);
  };

  // Sync audio with parent’s isPlaying flag
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
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
        <audio ref={audioRef} src={track.audioUrl}></audio>
      </div>

      {/* Metadata */}
      <div className="track-row__meta">
        <div className="track-row__title">{track.title}</div>
        <div className="track-row__sub">#{track.genre || 'Unknown'}</div>
      </div>

      <div className="track-row__spacer" />

      {/* Like Button */}
      <div>
        <button onClick={toggleLike}>
          {liked ? '💖' : '🤍'} {likesCount}
        </button>
      </div>

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
