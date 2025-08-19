import React, { useState } from 'react';
import { useTracksFeed } from '../../hooks/UseTracksFeed.js';
import TrackResults from '../../sections/TrackResults/TrackResults.jsx';
import CategoryPills from '../../sections/CategoryPills/CategoryPills.jsx';
import FiltersBar from '../../sections/FiltersBar/FiltersBar.jsx';
import './ExploreTracksPage.css'; // Import styles for ExploreTracksPage

export default function ExploreTracksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { tracks, isLoading, fetchNext, nextCursor } = useTracksFeed(searchQuery);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  return (
    <div className="explore">
      <div className="explore__inner">
        <header className="explore__header">
          <h1>Explore Tracks</h1>
          <p className="explore__subtitle">
            Find your next idea. Filters and categories are coming soon.
          </p>
        </header>

        <CategoryPills />

        <div className="explore__controls">
          <div className="explore__search">
            <input
              placeholder="Try searching Trap or Sad or Juice Wrld..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn--search">Search</button>
          </div>

          <div className="explore__chips">
            {['dancehall', 'freestyle', 'drake type beat', 'love'].map((tag) => (
              <button key={tag} className="chip" onClick={() => setSearchQuery(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <FiltersBar />

        <TrackResults
          tracks={tracks}
          isLoading={isLoading}
          nextCursor={nextCursor}
          onLoadMore={fetchNext}
          playingTrackId={playingTrackId}
          onPlay={(id) => setPlayingTrackId(id)}
          onPause={() => setPlayingTrackId(null)}
        />
      </div>
    </div>
  );
}
