// backend/src/realtime/socket.js
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { ObjectId } from 'mongodb';
import { getDB } from '../loaders/db.js';

let ioRef = null;
const oid = (v) => { try { return new ObjectId(String(v)); } catch { return null; } };

export async function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || true, credentials: true },
    path: '/socket.io'
  });
  ioRef = io;

  // Auth: Firebase ID token via handshake
  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers?.authorization;
      const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
      const token = socket.handshake.auth?.token || bearer;
      if (!token) return next(new Error('unauthorized'));
      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = { uid: decoded.uid };
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.user.uid;
    const db = getDB();

    // Per-user room (inbox updates, etc.)
    socket.join(`user:${uid}`);

    /**
     * Join a conversation room
     */
    socket.on('conversation:join', async ({ conversationId }) => {
      const _id = oid(conversationId);
      if (!_id) return;
      const convo = await db.collection('conversations').findOne({ _id, participants: uid });
      if (!convo) return;
      socket.join(`conversation:${_id.toString()}`);
      socket.emit('conversation:joined', { conversationId: _id.toString() });
    });

    /**
     * Send a message via socket (server persists + emits)
     */
    socket.on('message:send', async ({ conversationId, text }, cb) => {
      try {
        const _id = oid(conversationId);
        if (!_id) return cb?.({ ok: false, error: 'bad_conversation_id' });

        const convo = await db.collection('conversations').findOne({ _id, participants: uid });
        if (!convo) return cb?.({ ok: false, error: 'not_allowed' });

        const other = convo.participants.find((x) => x !== uid);
        if (!other) return cb?.({ ok: false, error: 'self_dm' }); // guard self-DM

        const cleanText = (text || '').toString().trim();
        if (!cleanText) return cb?.({ ok: false, error: 'empty_message' });
        if (cleanText.length > 4000) return cb?.({ ok: false, error: 'too_long' });

        const now = new Date();
        const msg = {
          conversationId: _id,
          senderUid: uid,
          text: cleanText,
          createdAt: now
        };
        const { insertedId } = await db.collection('messages').insertOne(msg);

        // --- Atomic pipeline update (MongoDB 4.2+)
        // NOTE: Assumes ObjectId monotonicity for lastMessage ordering.
        // If pivoting to UUIDs, replace this with createdAt comparison.
        await db.collection('conversations').updateOne(
          { _id },
          [
            {
              $set: {
                updatedAt: now,
                // increment recipient's unread counter only
                [`unreadCounts.${other}`]: {
                  $add: [{ $ifNull: [`$unreadCounts.${other}`, 0] }, 1]
                },
                lastMessage: {
                  $cond: [
                    { $or: [
                      { $lt: ['$lastMessage._id', insertedId] },
                      { $not: ['$lastMessage'] }
                    ]},
                    {
                      _id: insertedId,
                      text: cleanText,
                      senderUid: uid,
                      createdAt: now
                    },
                    '$lastMessage'
                  ]
                }
              }
            }
          ]
        );

        const payload = { _id: insertedId, ...msg };

        // Emit ordering: conversation update first, then message:new
        io.to(`conversation:${_id.toString()}`).emit('message:new', payload);

        // Notify recipient’s inbox
        if (other) {
          const udoc = await db.collection('conversations').findOne(
            { _id },
            { projection: { [`unreadCounts.${other}`]: 1, lastMessage: 1, updatedAt: 1 } }
          );
          io.to(`user:${other}`).emit('conversation:updated', {
            conversationId: _id.toString(),
            unreadForMe: udoc?.unreadCounts?.[other] ?? 0,
            lastMessage: udoc?.lastMessage,
            updatedAt: udoc?.updatedAt
          });
        }

        return cb?.({ ok: true, msg: payload });
      } catch (e) {
        console.error('[socket message:send] error', e);
        return cb?.({ ok: false, error: 'server_error' });
      }
    });

    socket.on('disconnect', () => {
      // Presence tracking hook
    });
  });

  return io;
}

export function getIO() {
  return ioRef;
}
