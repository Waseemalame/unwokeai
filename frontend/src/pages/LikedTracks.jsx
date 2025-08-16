// src/pages/LikedTracks.jsx
import { useEffect, useState, useCallback } from 'react';
// assume you have Firebase client installed/initialized elsewhere
import { getAuth } from 'firebase/auth';

async function authedFetch(url, options = {}) {
  const auth = getAuth();
  const idToken = await auth.currentUser?.getIdToken?.();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export default function LikedTracks() {
  const [items, setItems] = useState([]);           // [{ likedAt, track }]
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async (cursor) => {
    try {
      setLoading(true);
      setErr(null);
      const url = new URL('/api/me/likes', window.location.origin);
      if (cursor) url.searchParams.set('cursor', cursor);
      url.searchParams.set('limit', '24');
      const res = await authedFetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems((prev) => prev.concat(data.items || []));
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      setErr(e.message || 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  const toggleLike = async (trackId, liked) => {
    const method = liked ? 'DELETE' : 'POST';
    const res = await authedFetch(`/api/tracks/${trackId}/like`, { method });
    const data = await res.json();

    // Update local list if unliked
    if (method === 'DELETE' && res.ok) {
      setItems((prev) => prev.filter((it) => it.track._id !== trackId));
    } else if (method === 'POST' && res.ok) {
      // (not typical on this page, but kept for completeness)
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Liked Tracks</h1>
      {err && <div style={{ color: 'red' }}>{err}</div>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16 }}>
        {items.map(({ likedAt, track }) => (
          <li key={track._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <img src={track.coverUrl} alt="" width={80} height={80} style={{ objectFit: 'cover', borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{track.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {track.ownerHandle || track.ownerUid} • liked {new Date(likedAt).toLocaleString()}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => toggleLike(track._id, true)}>Unlike</button>
                  <span>❤️ {track.likesCount ?? 0}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        {nextCursor ? (
          <button disabled={loading} onClick={() => load(nextCursor)}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          !loading && <div>No more</div>
        )}
      </div>
    </div>
  );
}
