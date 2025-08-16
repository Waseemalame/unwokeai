export default function TrackCard({ track }) {
  return (
    <div className="track-card">
      <img
        className="track-card__cover"
        src={track.coverUrl || 'https://placehold.co/400x400?text=Cover'}
        alt={track.title}
      />
      <div className="track-card__title">{track.title}</div>
      <div className="track-card__meta">{track.genre || 'Unknown genre'}</div>
      <audio className="track-card__audio" controls src={track.audioUrl} />
    </div>
  );
}