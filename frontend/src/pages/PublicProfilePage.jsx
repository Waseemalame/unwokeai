import React from 'react';
import { useParams } from 'react-router-dom';
import TrackCard from '../components/TrackCard.jsx';
import { useUserTracks } from '../hooks/UseUserTracksFeed.js';
import { useUserProfile } from '../hooks/useUserProfile.js';

export default function PublicProfilePage() {
  const { uid: userId } = useParams(); // route param name can be uid; using full var name here
  const { profile } = useUserProfile(userId);
  const { tracks, nextCursor, isLoading, fetchNext } = useUserTracks(userId);

  return (
    <div style={{ padding: 24 }}>
      <h2>Profile</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={profile?.avatarUrl || 'https://placehold.co/80x80?text=U'}
          width={64}
          height={64}
          style={{ borderRadius: '50%' }}
          alt="Avatar"
        />
        <div>
          <div style={{ fontWeight: 600 }}>
            {profile?.displayName || profile?.email || 'Unnamed user'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{profile?.email}</div>
        </div>
      </div>

      <h3>Published Tracks</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {tracks.map((track) => (
          <TrackCard key={track._id || track.audioUrl} track={track} />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {nextCursor && (
          <button onClick={fetchNext} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
