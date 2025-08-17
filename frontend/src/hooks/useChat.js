// src/hooks/useChat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useChatSocket } from '../realtime/ChatProvider.jsx';

export default function useChat(conversationId) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const { socket, ready } = useChatSocket();

  const authedFetch = useCallback(async (url, opts = {}) => {
    const t = await getToken();
    return fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}), Authorization: `Bearer ${t}` }
    });
  }, [getToken]);

  const load = useCallback(async (cursor = null) => {
    if (!conversationId) return;
    setLoading(true);
    const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin);
    if (cursor) url.searchParams.set('cursor', cursor);
    url.searchParams.set('limit', '50');
    const res = await authedFetch(url.toString());
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    // API returns ascending; prepend older history
    setMessages(prev => [...(data.items || []), ...prev]);
    setNextCursor(data.nextCursor || null);
    setLoading(false);
  }, [conversationId, authedFetch]);

  // SEND: use socket for existing conversations
  const send = useCallback(async (text, attachments = []) => {
    if (!conversationId) return;
    if (ready && socket) {
      await new Promise(resolve => {
        socket.emit('message:send', { conversationId, text, attachments }, () => resolve());
      });
    } else {
      // Optional: fallback REST (only if you later add POST /api/conversations/:id/messages)
      await authedFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, attachments })
      }).catch(() => {});
    }
  }, [conversationId, ready, socket, authedFetch]);

  // reset & initial load on conversation change
  useEffect(() => {
    setMessages([]);
    setNextCursor(null);
    if (conversationId) load();
  }, [conversationId, load]);

  // join room & listen for new messages
  useEffect(() => {
    if (!ready || !socket || !conversationId) return;

    socket.emit('conversation:join', { conversationId });

    const onNew = (msg) => {
      if (msg.conversationId && String(msg.conversationId) !== String(conversationId)) return;
      setMessages(prev => {
        const exists = msg._id && prev.some(p => String(p._id) === String(msg._id));
        return exists ? prev : [...prev, msg];
      });
    };

    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, ready, conversationId]);

  return {
    messages,
    send,
    loadMore: () => nextCursor && load(nextCursor),
    hasMore: !!nextCursor,
    loading,
  };
}
