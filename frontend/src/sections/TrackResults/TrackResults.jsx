import React from 'react';
import TrackCard from '../../components/TrackCard/TrackCard';
import './TrackResults.css'; // Import styles for TrackResults
export default function TrackResults({
  tracks,
  isLoading,
  nextCursor,
  onLoadMore,
  playingTrackId,
  onPlay,
  onPause
}) {
  return (
    <>
      <div className="results">
        {tracks.map((t) => (
          <TrackCard
            key={t._id || t.audioUrl}
            track={t}
            isPlaying={playingTrackId === (t._id || t.audioUrl)}
            onPlay={() => onPlay(t._id || t.audioUrl)}
            onPause={onPause}
          />
        ))}
        {tracks.length === 0 && !isLoading && (
          <div className="results__empty">No tracks yet. Try another search.</div>
        )}
      </div>

      <div className="results__footer">
        {nextCursor && (
          <button className="btn btn--load" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </>
  );
}
