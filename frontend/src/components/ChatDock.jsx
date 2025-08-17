// src/components/ChatDock.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef
} from 'react';
import MessageList from './MessageList.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useChatSocket } from '../realtime/ChatProvider.jsx';
import useChat from '../hooks/useChat.js';

const ChatDockCtx = createContext({ openByUid: () => {}, openByConversationId: () => {} });

export function useChatDock() {
  return useContext(ChatDockCtx);
}

function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async (url, opts = {}) => {
      const t = await getToken?.();
      return fetch(url, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.headers || {}),
          ...(t ? { Authorization: `Bearer ${t}` } : {})
        }
      });
    },
    [getToken]
  );
}

function ChatPanel({ withUid, conversationId, onClose, offsetPx = 0 }) {
  const authedFetch = useAuthedFetch();
  const { user } = useAuth();
  const { socket, ready: socketReady } = useChatSocket();

  const [convoId, setConvoId] = useState(conversationId || null);
  const [title, setTitle] = useState('Message');
  const [min, setMin] = useState(false);
  const [draft, setDraft] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);

  const [otherSeenMsgId, setOtherSeenMsgId] = useState(null);
  const lastSentReceiptRef = useRef(null);

  const chat = useChat(convoId);

  const listRef = useRef(null);
  const scrollToBottom = (smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  };
  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (!convoId && withUid) setTitle('New message');
  }, [withUid, convoId]);

  // Load other user by convoId
  useEffect(() => {
    (async () => {
      if (withUid) return;
      if (!convoId) return;
      try {
        const res = await authedFetch('/api/conversations');
        if (!res.ok) return;
        const data = await res.json();
        const row = (data.items || []).find(c => String(c._id) === String(convoId));
        const otherUid = row?.otherUid;
        if (!otherUid) return;
        const ures = await authedFetch(`/api/users/${otherUid}/profile`);
        if (!ures.ok) return;
        const udata = await ures.json();
        setOtherUser({ ...udata, avatarUrl: udata.avatarUrl || udata.photoUrl || null });
        setTitle(udata.displayName || 'Message');
      } catch {}
    })();
  }, [convoId, withUid, authedFetch]);

  // Load other user by withUid
  useEffect(() => {
    if (!withUid) return;
    (async () => {
      try {
        const ures = await authedFetch(`/api/users/${withUid}/profile`);
        if (!ures.ok) return;
        const udata = await ures.json();
        setOtherUser({ ...udata, avatarUrl: udata.avatarUrl || udata.photoUrl || null });
        setTitle(udata.displayName || 'Message');
      } catch {}
    })();
  }, [withUid, authedFetch]);

  // Read receipts
  useEffect(() => {
    if (!socketReady || !socket || !convoId) return;
    const onRead = ({ conversationId, readerUid, lastSeenMessageId }) => {
      if (String(conversationId) !== String(convoId)) return;
      if (readerUid === user?.uid) return;
      setOtherSeenMsgId(lastSeenMessageId || null);
    };
    socket.on('conversation:read', onRead);
    return () => socket.off('conversation:read', onRead);
  }, [socket, socketReady, convoId, user?.uid]);

  // Mark-as-read
  useEffect(() => {
    if (!convoId || min) return;
    const lastMsg = chat.messages[chat.messages.length - 1];
    if (!lastMsg) return;
    const lastId = String(lastMsg._id || '');
    if (!lastId || lastSentReceiptRef.current === lastId) return;

    (async () => {
      try {
        await authedFetch(`/api/conversations/${convoId}/read`, {
          method: 'POST',
          body: JSON.stringify({ lastSeenMessageId: lastId })
        });
        lastSentReceiptRef.current = lastId;
      } catch {}
    })();
  }, [convoId, min, chat.messages, authedFetch]);

  // Scroll behaviors
  useEffect(() => { setTimeout(() => scrollToBottom(false), 0); }, [convoId, min]);
  useEffect(() => {
    if (!convoId || !chat.messages.length) return;
    scrollToBottom(false);
  }, [convoId, chat.loading, chat.messages.length]);
  useEffect(() => {
    if (!chat.messages.length) return;
    const atBottom = isNearBottom();
    const lastMsg = chat.messages[chat.messages.length - 1];
    const iSentIt = lastMsg && lastMsg.senderUid === user?.uid;
    if (atBottom || iSentIt) scrollToBottom(!atBottom);
  }, [chat.messages.length, user?.uid]);

  const styles = {
    wrap: {
      position: 'fixed',
      bottom: 0,
      right: 20 + offsetPx,
      width: 320,
      height: 420,
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
      fontSize: 14,
      zIndex: 1000
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: '#f5f6f7',
      borderBottom: '1px solid #ddd',
      fontWeight: 600
    },
    btn: {
      background: 'transparent',
      border: 'none',
      fontSize: 16,
      cursor: 'pointer',
      marginLeft: 6
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: 10,
      background: '#fff'
    },
    input: {
      flex: 1,
      border: '1px solid #ddd',
      borderRadius: 16,
      padding: '6px 12px',
      fontSize: 14
    },
    send: {
      background: '#0084ff',
      color: '#fff',
      border: 'none',
      borderRadius: 16,
      padding: '6px 14px',
      cursor: 'pointer',
      fontSize: 14
    }
  };

  const showSeen = (() => {
    if (!user?.uid || !chat.messages.length) return false;
    const lastMsg = chat.messages[chat.messages.length - 1];
    if (lastMsg.senderUid !== user.uid) return false;
    if (!otherSeenMsgId) return false;
    return String(otherSeenMsgId) === String(lastMsg._id);
  })();

  if (min) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 20 + offsetPx,
          width: 200,
          height: 40,
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontFamily: 'sans-serif',
          fontSize: 14,
          zIndex: 1000
        }}
        onClick={() => setMin(false)}
      >
        <span>{title} 💬</span>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer'
          }}
          onClick={e => {
            e.stopPropagation(); // don’t expand if closing
            onClose();
          }}
        >
          ×
        </button>
      </div>
    );
  }

  // Expanded full chat
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span>{title}</span>
        <div>
          <button
            style={styles.btn}
            title="Minimize"
            onClick={() => setMin(true)}
          >
            —
          </button>
          <button style={styles.btn} title="Close" onClick={onClose}>×</button>
        </div>
      </div>

      <div ref={listRef} style={styles.list}>
        <button
          onClick={() => chat.loadMore()}
          disabled={!chat.hasMore || chat.loading}
          style={{
            marginBottom: 8,
            border: '1px solid #eee',
            background: '#fafafa',
            borderRadius: 6,
            padding: '6px 8px',
            cursor: chat.hasMore ? 'pointer' : 'default'
          }}
        >
          {chat.loading ? 'Loading…' : chat.hasMore ? 'Load older' : 'No older messages'}
        </button>

        <MessageList messages={chat.messages} otherUser={otherUser} />

        {showSeen && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, paddingRight: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Seen</span>
          </div>
        )}
      </div>

      <form
        onSubmit={async e => {
          e.preventDefault();
          const text = draft.trim();
          if (!text || sending) return;
          setSending(true);
          try {
            if (convoId) {
              await chat.send(text);
            } else if (withUid) {
              const res = await authedFetch(`/api/dm/${withUid}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text })
              });
              if (res.ok) {
                const data = await res.json();
                setConvoId(String(data.conversationId));
              } else {
                const err = await res.json().catch(() => ({}));
                alert(err?.message || 'Failed to send');
              }
            }
            setDraft('');
            setTimeout(() => scrollToBottom(true), 0);
          } catch (err) {
            console.error(err);
          } finally {
            setSending(false);
          }
        }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}
      >
        <input
          style={styles.input}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit" style={styles.send} disabled={sending || (!convoId && !withUid)}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export function ChatDockProvider({ children }) {
  const { user } = useAuth();
  const [panes, setPanes] = useState([]);

  // clear on logout
  useEffect(() => {
    if (!user) {
      setPanes([]);
    }
  }, [user]);

  const openByUid = useCallback(uid => {
    setPanes(p => [...p, { key: 'dm:' + uid, withUid: uid }]);
  }, []);
  const openByConversationId = useCallback(id => {
    setPanes(p => [...p, { key: 'c:' + id, conversationId: id }]);
  }, []);

  const close = useCallback(key => {
    setPanes(prev => prev.filter(p => p.key !== key));
  }, []);

  const value = useMemo(() => ({ openByUid, openByConversationId }), [openByUid, openByConversationId]);

  return (
    <ChatDockCtx.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row-reverse',
          gap: 12,
          padding: 12,
          pointerEvents: 'none'
        }}
      >
        {panes.map((p, i) => (
          <div key={p.key} style={{ pointerEvents: 'auto' }}>
            <ChatPanel
              withUid={p.withUid}
              conversationId={p.conversationId}
              offsetPx={i * 340}
              onClose={() => close(p.key)}
            />
          </div>
        ))}
      </div>
    </ChatDockCtx.Provider>
  );
}
