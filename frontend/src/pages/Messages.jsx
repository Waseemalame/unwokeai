import { useCallback, useEffect, useMemo, useState } from 'react';
import MessageList from '../components/MessageList.jsx';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useChatSocket } from '../realtime/ChatProvider.jsx';
import useChat from '../hooks/useChat.js';

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

export default function Messages() {
  const authedFetch = useAuthedFetch();
  const [search] = useSearchParams();
  const { socket, ready: socketReady } = useChatSocket();
  const [showNewDm, setShowNewDm] = useState(false);

  // inbox
  const [convos, setConvos] = useState([]);     // [{ _id, other:{...}, lastMessagePreview, updatedAt }]
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // chat for selected conversation
  const chat = useChat(selectedId);
  const [draft, setDraft] = useState('');

  const loadInbox = useCallback(async () => {
    try {
      setInboxLoading(true);
      setInboxError(null);
      const res = await authedFetch('/api/conversations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConvos(data.items || []);
      // auto-select first conversation if none selected
      if (!selectedId && data.items?.length) setSelectedId(String(data.items[0]._id));
    } catch (e) {
      setInboxError(e.message || 'Failed to load conversations');
    } finally {
      setInboxLoading(false);
    }
  }, [authedFetch, selectedId]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  // if URL has ?c=conversationId, preselect it
  useEffect(() => {
    const c = search.get('c');
    if (c) setSelectedId(c);
  }, [search]);

  // update inbox when server says a conversation changed
  useEffect(() => {
    if (!socketReady || !socket) return;
    const onUpdated = ({ conversationId, lastMessageAt, lastMessagePreview }) => {
      setConvos(prev => {
        const arr = [...prev];
        const idx = arr.findIndex(c => String(c._id) === String(conversationId));
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], lastMessageAt, lastMessagePreview, updatedAt: lastMessageAt };
          // move to top
          const [item] = arr.splice(idx, 1);
          arr.unshift(item);
          return arr;
        }
        // if it's not in the list (brand new), just reload inbox
        loadInbox();
        return prev;
      });
    };
    socket.on('conversation:updated', onUpdated);
    return () => socket.off('conversation:updated', onUpdated);
  }, [socket, socketReady, loadInbox]);

  // start a new DM by uid
  const [withUid, setWithUid] = useState('');
  const startDM = async (e) => {
    e.preventDefault();
    if (!withUid.trim()) return;
    const res = await authedFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ withUid: withUid.trim() })
    });
    if (res.ok) {
      const convo = await res.json();
      // add to inbox (dedupe)
      setConvos(prev => {
        const exists = prev.some(c => String(c._id) === String(convo._id));
        return exists ? prev : [convo, ...prev];
      });
      setSelectedId(String(convo._id));
      setWithUid('');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.message || 'Failed to create DM');
    }
  };

  const selected = useMemo(() => convos.find(c => String(c._id) === String(selectedId)) || null, [convos, selectedId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      {/* left: inbox */}
      <div style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!showNewDm ? (
            <button onClick={() => setShowNewDm(true)} style={{ padding: '6px 10px' }}>
              New message
            </button>
          ) : (
            <form onSubmit={startDM} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                value={withUid}
                onChange={e => setWithUid(e.target.value)}
                placeholder="Enter recipient UID…"
                style={{ flex: 1 }}
              />
              <button type="submit">Start</button>
              <button type="button" onClick={() => setShowNewDm(false)}>Cancel</button>
            </form>
          )}
        </div>

        <div style={{ padding: 12, fontWeight: 600 }}>Inbox</div>
        {inboxError && <div style={{ color: 'red', padding: 12 }}>{inboxError}</div>}
        {inboxLoading && <div style={{ padding: 12 }}>Loading…</div>}

        <div style={{ overflow: 'auto' }}>
          {convos.map(c => (
            <button
              key={String(c._id)}
              onClick={() => setSelectedId(String(c._id))}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 12,
                border: 0,
                borderTop: '1px solid #f2f2f2',
                background: String(c._id) === String(selectedId) ? '#f8f8f8' : 'white',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.other?.displayName || c.other?.handle || c.other?.firebaseUid || 'Unknown'}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {c.lastMessagePreview || '—'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''}
              </div>
            </button>
          ))}
          {!inboxLoading && convos.length === 0 && (
            <div style={{ padding: 12, opacity: 0.7 }}>No conversations yet</div>
          )}
        </div>
      </div>

      {/* right: thread */}
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: 'calc(100vh - 64px)' }}>
        {!selected ? (
          <div style={{ padding: 24, gridRow: '1 / span 3' }}>Select a conversation or start a new DM.</div>
        ) : (
          <>
            {/* header */}
            <div style={{ padding: 12, borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>
                {selected.other?.displayName || selected.other?.handle || selected.other?.firebaseUid || 'Conversation'}
              </div>
            </div>

            {/* messages */}
            <div style={{ overflow: 'auto', padding: 16 }}>
              <button
                onClick={() => chat.loadMore()}
                disabled={!chat.hasMore || chat.loading}
                style={{ marginBottom: 12 }}
              >
                {chat.loading ? 'Loading…' : chat.hasMore ? 'Load older' : 'No older messages'}
              </button>

              <MessageList messages={chat.messages} otherUser={selected.other} />
            </div>

            {/* composer */}
            <form
              onSubmit={e => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                chat.send(text);
                setDraft('');
              }}
              style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}
            >
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Type a message…"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={!selectedId}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
