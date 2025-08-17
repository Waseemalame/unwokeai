// src/realtime/ChatProvider.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthProvider.jsx';
import { getAuth, onIdTokenChanged } from 'firebase/auth';

const ChatCtx = createContext({ socket: null, ready: false });

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const socketRef = useRef(null);
  const tokenUnsubRef = useRef(null); // unsubscribe holder for token listener

  useEffect(() => {
    async function connect() {
      setReady(false);

      // tear down any previous socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // remove any previous token listener
      if (tokenUnsubRef.current) {
        tokenUnsubRef.current();
        tokenUnsubRef.current = null;
      }

      if (!user) {
        setReady(false);
        return;
      }

      const token = await user.getIdToken();

      // Use explicit URL in dev (VITE_SOCKET_URL=http://localhost:5000), else same-origin
      const baseURL = import.meta.env.DEV
      ? (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000')
      : ''; // same-origin in prod (auto wss on HTTPS)
  
      const s = io(baseURL || '/', {
      path: '/socket.io',
      // allow polling fallback; many proxies need it
      withCredentials: true,
      auth: { token },
      });

      s.on('connect', () => setReady(true));
      s.on('disconnect', () => setReady(false));
      s.on('connect_error', (e) => {
        console.error('[socket connect_error]', e?.message || e);
        setReady(false);
      });

      socketRef.current = s;

      // 🔄 Re-auth the socket when Firebase silently refreshes the ID token
      const auth = getAuth();
      tokenUnsubRef.current = onIdTokenChanged(auth, async (u) => {
        if (!socketRef.current) return;
        if (!u) {
          // user signed out
          socketRef.current.auth = { token: '' };
          socketRef.current.disconnect();
          return;
        }
        try {
          const newToken = await u.getIdToken();
          socketRef.current.auth = { token: newToken };
          // Force a quick reconnect so the new token is sent in the handshake
          socketRef.current.disconnect().connect();
        } catch {
          // if refresh fails, drop to unauth and reconnect
          socketRef.current.auth = { token: '' };
          socketRef.current.disconnect().connect();
        }
      });
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (tokenUnsubRef.current) {
        tokenUnsubRef.current();
        tokenUnsubRef.current = null;
      }
    };
  }, [user]);

  const value = useMemo(
    () => ({ socket: socketRef.current, ready }),
    [ready, socketRef.current]
  );

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChatSocket() {
  return useContext(ChatCtx);
}
