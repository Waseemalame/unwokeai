// backend/src/routes/messages.js
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import verifyFirebaseToken from '../middleware/authMiddleware.js';
import { getDB } from '../loaders/db.js';
import { getIO } from '../realtime/socket.js';

const router = Router();
const oid = (v) => { try { return new ObjectId(String(v)); } catch { return null; } };

// Helpers
function dmKey(a, b) {
  return [a, b].sort().join(':'); // uidA:uidB
}

/**
 * GET /api/conversations
 * List conversations for current user.
 */
router.get('/conversations', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const me = req.user.uid;

  try {
    const convos = await db.collection('conversations').aggregate([
      { $match: { type: 'dm', participants: me } },
      { $sort: { updatedAt: -1 } },
      {
        $addFields: {
          otherUid: {
            $first: {
              $filter: { input: '$participants', as: 'u', cond: { $ne: ['$$u', me] } }
            }
          },
          unreadForMe: { $ifNull: [`$unreadCounts.${me}`, 0] },
          lastSeenMessageId: { $ifNull: [`$lastSeenMessageId.${me}`, null] }
        }
      },
      {
        $project: {
          participants: 1,
          participantsKey: 1,
          lastMessage: 1,
          unreadForMe: 1,
          lastSeenMessageId: 1,
          blockedBy: 1,
          mutedBy: 1,
          createdAt: 1,
          updatedAt: 1,
          otherUid: 1
        }
      }
    ]).toArray();

    res.json({ items: convos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

/**
 * POST /api/dm/:withUid/messages
 * Send a message to a UID (creates DM if not exists).
 */
router.post('/dm/:withUid/messages', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const me = req.user.uid;
  const withUid = String(req.params.withUid || '').trim();
  if (!withUid || withUid === me) {
    return res.status(400).json({ message: 'Invalid recipient' });
  }

  const key = dmKey(me, withUid);
  const now = new Date();

  // Step A: upsert conversation
  const upsertResult = await db.collection('conversations').findOneAndUpdate(
    { participantsKey: key },
    {
      $setOnInsert: {
        type: 'dm',
        participants: [me, withUid].sort(),
        participantsKey: key,
        unreadCounts: { [me]: 0, [withUid]: 0 },
        lastSeenMessageId: { [me]: null, [withUid]: null },
        blockedBy: {},
        mutedBy: {},
        createdAt: now,
        updatedAt: now
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  let convo = upsertResult.value;
  if (!convo) {
    convo = await db.collection('conversations').findOne({ participantsKey: key });
    if (!convo) {
      return res.status(500).json({ message: 'Failed to create or fetch conversation' });
    }
  }

  const isNew = !!upsertResult.lastErrorObject?.upsertedId;

  // Step B: validate and insert message
  const { text } = req.body || {};
  const cleanText = (text || '').toString().trim();
  if (!cleanText) return res.status(400).json({ message: 'text required' });
  if (cleanText.length > 4000) return res.status(400).json({ message: 'too long' });

  const msg = {
    conversationId: convo._id,
    senderUid: me,
    text: cleanText,
    createdAt: now
  };
  const { insertedId } = await db.collection('messages').insertOne(msg);

  // Step C: bump convo metadata
  const otherUid = convo.participants.find((u) => u !== me);
  await db.collection('conversations').updateOne(
    { _id: convo._id },
    {
      $inc: { [`unreadCounts.${otherUid}`]: 1 },
      $set: {
        updatedAt: now,
        lastMessage: {
          _id: insertedId,
          text: cleanText,
          senderUid: me,
          createdAt: now
        }
      }
    }
  );

  // Step D: sockets
  const io = getIO();
  if (io) {
    const payload = { _id: insertedId, ...msg };

    if (isNew) {
      io.to(`user:${withUid}`).emit('conversation:new', convo);
    } else {
      const udoc = await db.collection('conversations').findOne(
        { _id: convo._id },
        { projection: { [`unreadCounts.${withUid}`]: 1, lastMessage: 1, updatedAt: 1 } }
      );
      io.to(`user:${withUid}`).emit('conversation:updated', {
        conversationId: convo._id.toString(),
        unreadForMe: udoc?.unreadCounts?.[withUid] ?? 0,
        lastMessage: udoc?.lastMessage,
        updatedAt: udoc?.updatedAt
      });
    }

    io.to(`conversation:${convo._id}`).emit('message:new', payload);
  }

  res.status(201).json({
    conversationId: convo._id.toString(),
    message: { _id: insertedId, ...msg }
  });
});

/**
 * POST /api/conversations/:id/messages
 * Send a message into an existing conversation.
 */
router.post('/conversations/:id/messages', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const me = req.user.uid;
  const convId = oid(req.params.id);
  if (!convId) return res.status(400).json({ message: 'Invalid conversation id' });

  const convo = await db.collection('conversations').findOne({ _id: convId, participants: me });
  if (!convo) return res.status(404).json({ message: 'Conversation not found' });

  const { text } = req.body || {};
  const cleanText = (text || '').toString().trim();
  if (!cleanText) return res.status(400).json({ message: 'text required' });
  if (cleanText.length > 4000) return res.status(400).json({ message: 'too long' });

  const now = new Date();
  const msg = {
    conversationId: convId,
    senderUid: me,
    text: cleanText,
    createdAt: now
  };
  const { insertedId } = await db.collection('messages').insertOne(msg);

  const other = convo.participants.find((u) => u !== me);

  // Update conversation (unread, updatedAt, lastMessage snapshot)
  await db.collection('conversations').updateOne(
    { _id: convId },
    {
      $inc: { [`unreadCounts.${other}`]: 1 },
      $set: {
        updatedAt: now,
        lastMessage: {
          _id: insertedId,
          text: cleanText,
          senderUid: me,
          createdAt: now
        }
      }
    }
  );

  // Socket emit
  const io = getIO();
  if (io) {
    const payload = { _id: insertedId, ...msg };

    // recipient badge update
    const udoc = await db.collection('conversations').findOne(
      { _id: convId },
      { projection: { [`unreadCounts.${other}`]: 1, lastMessage: 1, updatedAt: 1 } }
    );
    io.to(`user:${other}`).emit('conversation:updated', {
      conversationId: convId.toString(),
      unreadForMe: udoc?.unreadCounts?.[other] ?? 0,
      lastMessage: udoc?.lastMessage,
      updatedAt: udoc?.updatedAt
    });

    // message broadcast
    io.to(`conversation:${convId.toString()}`).emit('message:new', payload);
  }

  res.status(201).json({ conversationId: convId.toString(), message: { _id: insertedId, ...msg } });
});

/**
 * POST /api/conversations/:id/read
 * Mark messages as read for current user.
 */
router.post('/conversations/:id/read', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const me = req.user.uid;
  const convId = oid(req.params.id);
  const lastSeenMessageId = oid(req.body.lastSeenMessageId);
  if (!convId) {
    return res.status(400).json({ message: 'Invalid conversation id' });
  }

  const convo = await db.collection('conversations').findOne({ _id: convId, participants: me });
  if (!convo) return res.status(404).json({ message: 'Conversation not found' });

  await db.collection('conversations').updateOne(
    { _id: convId },
    {
      $set: { [`unreadCounts.${me}`]: 0 },
      ...(lastSeenMessageId ? { $max: { [`lastSeenMessageId.${me}`]: lastSeenMessageId } } : {})
    }
  );

const io = getIO();
if (io) {
  const other = convo.participants.find((u) => u !== me);

  // Tell the other user I read their messages
  io.to(`user:${other}`).emit('conversation:read', {
    conversationId: convId.toString(),
    readerUid: me,
    lastSeenMessageId: lastSeenMessageId?.toString() || null
  });

  // Tell myself (so my unread badge clears instantly)
  io.to(`user:${me}`).emit('conversation:updated', {
    conversationId: convId.toString(),
    unreadForMe: 0
  });
}

  res.json({ ok: true });
});

/**
 * GET /api/conversations/:id/messages
 * Paginate messages for a conversation.
 */
router.get('/conversations/:id/messages', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const me = req.user.uid;
  const convId = oid(req.params.id);
  if (!convId) return res.status(400).json({ message: 'Invalid conversation id' });

  const convo = await db.collection('conversations').findOne({ _id: convId, participants: me });
  if (!convo) return res.status(404).json({ message: 'Conversation not found' });

  const limit = Math.min(Math.max(parseInt(req.query.limit ?? '50', 10), 1), 200);
  const cursor = req.query.cursor;

  const match = { conversationId: convId };
  if (cursor) {
    const c = oid(cursor);
    if (c) match._id = { $lt: c };
  }

  const items = await db.collection('messages')
    .find(match)
    .sort({ _id: -1 })
    .limit(limit)
    .toArray();

  items.reverse(); // newest at end
  res.json({ items, nextCursor: items.at(0)?._id.toString() ?? null });
});

export default router;
