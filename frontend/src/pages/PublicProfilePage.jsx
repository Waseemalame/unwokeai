import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserTracks } from '../hooks/UseUserTracksFeed.js';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useChatDock } from '../components/ChatDock.jsx';
import TrackCard from '../components/TrackCard/TrackCard.jsx';

export default function PublicProfilePage() {
  const { uid, handle } = useParams();
  const identifier = uid || handle; // use whichever is present
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const { profile } = useUserProfile(identifier);
  const { tracks, nextCursor, isLoading, fetchNext } = useUserTracks(identifier);

  const { openByUid } = useChatDock();

  function openDM() {
    const targetUid = uid || profile?.firebaseUid;
    if (!targetUid) {
      alert('Could not determine the user id to DM');
      return;
    }
    openByUid(targetUid); // ⬅️ opens the bottom-right pop-up
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Profile</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

        {/* Message button */}
        <button
          style={{ padding: '6px 12px', borderRadius: 6, background: '#007bff', color: 'white', border: 'none' }}
          onClick={openDM}
        >
          Message
        </button>
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
