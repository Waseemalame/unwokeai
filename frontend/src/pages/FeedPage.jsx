import React, { useState } from 'react';
import TrackCard from '../components/TrackCard.jsx';
import { useTracksFeed } from '../hooks/UseTracksFeed.js';

import '../styles/feed.css'; // Import feed styles

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { tracks, isLoading, fetchNext, nextCursor } = useTracksFeed(searchQuery);

  // 👇 New state: which track is playing
  const [playingTrackId, setPlayingTrackId] = useState(null);

  return (
    <div className="feed">
      <h2 className="feed__title">Discover Tracks</h2>

      <input
        className="feed__search"
        placeholder="Search tracks…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="feed__grid">
        {tracks.map((track) => (
          <TrackCard
            key={track._id || track.audioUrl}
            track={track}
            isPlaying={playingTrackId === track._id}
            onPlay={() => setPlayingTrackId(track._id)}
            onPause={() => setPlayingTrackId(null)}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {nextCursor && (
          <button
            className="btn btn--load"
            onClick={fetchNext}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
