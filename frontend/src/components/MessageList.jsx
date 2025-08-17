// src/components/MessageList.jsx
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function MessageList({ messages, otherUser }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const firstLoad = useRef(true);

  // Auto-scroll: instant on first load, smooth afterwards
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: firstLoad.current ? 'auto' : 'smooth',
      });
      firstLoad.current = false;
    }
  }, [messages]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflowY: 'auto',
        flex: 1,
      }}
    >
      {messages.map((m) => {
        const isMine = m.senderUid === user?.uid;
        return (
          <div
            key={m._id}
            style={{
              display: 'flex',
              justifyContent: isMine ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            {/* Show avatar only for other user’s messages */}
            {!isMine && (
              <img
                src={otherUser?.avatarUrl || 'https://i.imgur.com/Yacxo8R.jpeg'}
                alt="avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://i.imgur.com/Yacxo8R.jpeg';
                }}
              />
            )}

            <div
              style={{
                maxWidth: '60%',
                background: isMine ? '#0084ff' : '#f0f0f0',
                color: isMine ? 'white' : 'black',
                padding: '8px 12px',
                borderRadius: 16,
              }}
            >
              <div>{m.text}</div>
              {m.createdAt && (
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    marginTop: 4,
                    textAlign: isMine ? 'right' : 'left',
                  }}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Invisible anchor to scroll into view */}
      <div ref={bottomRef} />
    </div>
  );
}
