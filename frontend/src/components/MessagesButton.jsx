// src/components/MessagesButton.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useChatSocket } from '../realtime/ChatProvider.jsx';
import { useChatDock } from './ChatDock.jsx';

function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(async (url, opts = {}) => {
    const t = await getToken?.();
    return fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) }
    });
  }, [getToken]);
}

export default function MessagesButton({ className = '', mobile = false, onOpen }) {
  const authedFetch = useAuthedFetch();
  const { socket, ready: socketReady } = useChatSocket();
  const { openByConversationId } = useChatDock();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [convos, setConvos] = useState([]);           // server rows: { _id, otherUid, lastMessage, updatedAt, unreadForMe }
  const [unreadTotal, setUnreadTotal] = useState(0);  // sum of unreadForMe
  const wrapRef = useRef(null);

  // simple in-memory cache of other user profiles
  const [profiles, setProfiles] = useState({}); // { [uid]: { displayName, handle, avatarUrl } }

  const recomputeTotal = useCallback((items) => {
    return items.reduce((sum, c) => sum + (Number(c.unreadForMe) || 0), 0);
  }, []);

  const ensureProfile = useCallback(async (uid) => {
    if (!uid) return;
    setProfiles(prev => {
      if (prev[uid]) return prev; // already cached
      (async () => {
        try {
          const res = await authedFetch(`/api/users/${uid}/profile`);
          if (res.ok) {
            const u = await res.json();
            setProfiles(p => ({
              ...p,
              [uid]: {
                displayName: u.displayName,
                handle: u.handle,
                avatarUrl: u.avatarUrl || u.photoUrl || null
              }
            }));
          }
        } catch {}
      })();
      return prev;
    });
  }, [authedFetch]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authedFetch('/api/conversations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = data.items || [];
      setConvos(items);
      setUnreadTotal(recomputeTotal(items));
      // prefetch profiles
      const uniq = [...new Set(items.map(c => c.otherUid).filter(Boolean))];
      await Promise.all(uniq.map(ensureProfile));
    } catch (e) {
      setError(e.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      onOpen?.();
      await load();
    }
  };

  // keep list fresh when server broadcasts updates
  useEffect(() => {
    if (!socketReady || !socket) return;
    const onUpdated = ({ conversationId, lastMessage, unreadForMe, updatedAt }) => {
      setConvos(prev => {
        const arr = [...prev];
        const idx = arr.findIndex(c => String(c._id) === String(conversationId));
        if (idx !== -1) {
          const prevItem = arr[idx];
          const nextItem = {
            ...prevItem,
            lastMessage: lastMessage ?? prevItem.lastMessage,
            updatedAt: updatedAt ?? prevItem.updatedAt,
            ...(typeof unreadForMe === 'number' ? { unreadForMe } : {})
          };
          arr[idx] = nextItem;
          const [item] = arr.splice(idx, 1);
          arr.unshift(item);
          // prefetch profile if new row added later
          if (nextItem.otherUid) ensureProfile(nextItem.otherUid);
          return arr;
        }
        // If it’s new to us, do a light refresh
        load();
        return prev;
      });
    };
    socket.on('conversation:updated', onUpdated);
    return () => socket.off('conversation:updated', onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, socketReady]);

  // recompute unread total whenever convos change
  useEffect(() => { setUnreadTotal(recomputeTotal(convos)); }, [convos, recomputeTotal]);

  // close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const styles = {
    wrap: { position: 'relative', display: 'inline-block' },
    btn: {
      border: '1px solid #e5e5e5',
      background: 'white',
      borderRadius: 8,
      padding: '6px 12px',
      cursor: 'pointer',
      position: 'relative'
    },
    badge: {
      position: 'absolute',
      top: -8,
      right: -8,
      minWidth: 22,
      height: 22,
      padding: '0 6px',
      borderRadius: 11,
      background: '#ff3b30',
      color: '#fff',
      fontSize: 12,
      lineHeight: '22px',
      textAlign: 'center',
      fontWeight: 800,
      boxShadow: '0 0 0 2px #111'
    },
    pop: {
      position: 'absolute',
      right: 0,
      top: '110%',
      width: mobile ? '90vw' : 360,
      maxHeight: mobile ? '60vh' : 520,
      background: '#fff',
      border: '1px solid #e5e5e5',
      borderRadius: 10,
      boxShadow: '0 12px 28px rgba(0,0,0,.12)',
      overflow: 'hidden',
      zIndex: 1000
    },
    header: {
      padding: 10,
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: 700,
      background: '#fafafa'
    },
    list: { maxHeight: mobile ? '40vh' : 380, overflow: 'auto' },
    row: (active = false) => ({
      width: '100%',
      textAlign: 'left',
      padding: 12,
      borderTop: '1px solid #f7f7f7',
      background: active ? '#f6f8ff' : '#fff',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }),
    rowTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    },
    name: { fontWeight: 600 },
    preview: { fontSize: 12, opacity: .7 },
    meta: { fontSize: 11, opacity: .6 },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 18,
      height: 18,
      padding: '0 6px',
      borderRadius: 9,
      background: '#ff3b30',
      color: '#fff',
      fontSize: 11,
      lineHeight: '18px',
      fontWeight: 800,
      flexShrink: 0
    },
    ghost: { border: '1px solid #e5e5e5', background: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }
  };

  return (
    <div ref={wrapRef} style={styles.wrap} className={className}>
      <button type="button" onClick={toggle} style={styles.btn} aria-haspopup="dialog" aria-expanded={open}>
        Messages
        {unreadTotal > 0 && (
          <span style={styles.badge}>{unreadTotal > 99 ? '99+' : unreadTotal}</span>
        )}
      </button>

      {open && (
        <div style={styles.pop} role="dialog" aria-label="Messages">
          <div style={styles.header}>
            <span>Inbox</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.ghost} onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
              <button style={styles.ghost} onClick={() => { setOpen(false); load(); }}>Close</button>
            </div>
          </div>

          {error && <div style={{ color: 'red', padding: 10 }}>{error}</div>}
          {!error && loading && <div style={{ padding: 10 }}>Loading…</div>}

          <div style={styles.list}>
            {convos.map(c => {
              const prof = c.otherUid ? profiles[c.otherUid] : null;
              const title = prof?.displayName || prof?.handle || c.otherUid || 'Unknown';
              const unread = Number(c.unreadForMe) || 0;
              const avatar = prof?.avatarUrl;
              return (
                <button
                  key={String(c._id)}
                  style={styles.row(false)}
                  onClick={() => { openByConversationId(String(c._id)); setOpen(false); }}
                >
                  <div style={styles.rowTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {avatar ? (
                        <img src={avatar} alt="" width={22} height={22} style={{ borderRadius: '50%' }} />
                      ) : <span style={{ opacity: .6 }}>👤</span>}
                      <div style={styles.name}>{title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={styles.meta}>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''}</div>
                      {unread > 0 && <span style={styles.pill}>{unread > 99 ? '99+' : unread}</span>}
                    </div>
                  </div>
                  <div style={styles.preview}>{c.lastMessage?.text || '—'}</div>
                </button>
              );
            })}
            {!loading && !error && convos.length === 0 && (
              <div style={{ padding: 12, opacity: .7 }}>No conversations yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
