import { Router } from 'express';
import { ObjectId } from 'mongodb';
import verifyFirebaseToken from '../middleware/authMiddleware.js';
import { getDB } from '../loaders/db.js';

const router = Router();
const oid = (v) => { try { return new ObjectId(String(v)); } catch { return null; } };

router.get('/me/likes', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { uid } = req.user;

  const limit = Math.min(Math.max(parseInt(req.query.limit ?? '24', 10), 1), 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;

  const match = { userUid: uid };
  if (cursor) {
    const edgeId = oid(cursor);
    if (edgeId) match._id = { $lt: edgeId }; // paginate by edge id
  }

  const items = await db.collection('track_likes').aggregate([
    { $match: match },
    { $sort: { _id: -1 } },                // newest likes first
    { $limit: limit },
    {
      $lookup: {
        from: 'tracks',
        localField: 'trackId',
        foreignField: '_id',
        as: 'track'
      }
    },
    { $unwind: '$track' },                 // drops if no matching track
    { $match: { 'track.isPublished': { $ne: false } } },
    {
      $project: {
        edgeId: '$_id',
        likedAt: '$createdAt',
        track: {
          _id: 1,
          title: 1,
          coverUrl: 1,
          ownerHandle: 1,
          ownerUid: 1,
          likesCount: 1,
          pricing: 1,
          audioUrl: 1,
          genre: 1,
          createdAt: 1
        }
      }
    }
  ]).toArray();

  const nextCursor = items.at(-1)?.edgeId?.toString() ?? null;
  res.json({ items, nextCursor });
});

/**
 * (Optional) Public: GET /api/users/:userId/likes
 * Same as /me/likes but by firebaseUid, no auth required (make it auth-only if you prefer).
 */
router.get('/users/:userId/likes', async (req, res) => {
  const db = getDB();
  const userUid = req.params.userId;

  const limit = Math.min(Math.max(parseInt(req.query.limit ?? '24', 10), 1), 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;

  const match = { userUid };
  if (cursor) {
    const byDate = new Date(cursor);
    if (!Number.isNaN(byDate.getTime())) {
      match.createdAt = { $lt: byDate };
    } else {
      const c = oid(cursor);
      if (c) match._id = { $lt: c };
    }
  }

  const items = await db.collection('track_likes').aggregate([
    { $match: match },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'tracks',
        localField: 'trackId',
        foreignField: '_id',
        as: 'track'
      }
    },
    { $unwind: '$track' },
    {
      $project: {
        _id: 0,
        likedAt: '$createdAt',
        track: 1
      }
    }
  ]).toArray();

  const nextCursor = items.at(-1)?.likedAt?.toISOString() ?? null;
  res.json({ items, nextCursor });
});

/** Like (record-only + maintain counter) */
router.post('/tracks/:id/like', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { uid } = req.user;
  const trackId = oid(req.params.id);
  if (!trackId) return res.status(400).json({ message: 'Invalid track id' });

  const tracks = db.collection('tracks');
  const edges  = db.collection('track_likes');

  const track = await tracks.findOne({ _id: trackId, isPublished: { $ne: false } });
  if (!track) return res.status(404).json({ message: 'Track not found' });

  // upsert edge; only increment if new
  const up = await edges.updateOne(
    { trackId, userUid: uid },
    { $setOnInsert: { trackId, userUid: uid, createdAt: new Date() } },
    { upsert: true }
  );

  if (up.upsertedCount === 1) {
    await tracks.updateOne({ _id: trackId }, { $inc: { likesCount: 1 } });
  }

  // Return minimal info (no list)
  const { likesCount = 0 } = await tracks.findOne({ _id: trackId }, { projection: { likesCount: 1 } }) || {};
  return res.json({ liked: true, likesCount });
});

/** Unlike (record-only + maintain counter) */
router.delete('/tracks/:id/like', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { uid } = req.user;
  const trackId = oid(req.params.id);
  if (!trackId) return res.status(400).json({ message: 'Invalid track id' });

  const tracks = db.collection('tracks');
  const edges  = db.collection('track_likes');

  const del = await edges.deleteOne({ trackId, userUid: uid });
  if (del.deletedCount === 1) {
    await tracks.updateOne(
      { _id: trackId, likesCount: { $gt: 0 } },
      { $inc: { likesCount: -1 } }
    );
  }

  const { likesCount = 0 } = await tracks.findOne({ _id: trackId }, { projection: { likesCount: 1 } }) || {};
  return res.json({ liked: false, likesCount });
});

export default router;
