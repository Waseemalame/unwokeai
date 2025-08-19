import React from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { useUserTracks } from '../hooks/UseUserTracksFeed.js';
import TrackCard from '../components/TrackCard/TrackCard.jsx';

export default function MyProfilePage() {
  const { user } = useAuth();
  const userId = user?.uid; // Firebase uid
  const { profile } = useUserProfile(userId);
  const { tracks, nextCursor, isLoading, fetchNext } = useUserTracks(userId);

  if (!userId) return null; // ProtectedRoute guards anyway

  return (
    <div style={{ padding: 24 }}>
      <h2>My Profile</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={profile?.avatarUrl || 'https://i.imgur.com/Yacxo8R.jpeg'}
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
