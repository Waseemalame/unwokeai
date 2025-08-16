import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../loaders/db.js';
import verifyFirebaseToken from '../middleware/authMiddleware.js';

const router = Router();

router.get('/tracks', async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '24', 10), 1), 100);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;

    const query = { isPublished: true };
    if (cursor) {
      const d = new Date(cursor);
      if (!isNaN(d.getTime())) query.createdAt = { $lt: d };
    }

    const items = await db.collection('tracks')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({
      items,
      nextCursor: items.at(-1)?.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[GET]/tracks', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:userId/tracks', async (req, res) => {
  const db = getDB();
  const { limit = 24, cursor } = req.query;
  const query = { ownerUid: req.params.userId, isPublished: true };
  if (cursor) query.createdAt = { $lt: new Date(String(cursor)) };

  const items = await db.collection('tracks')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .toArray();

  res.json({
    items,
    nextCursor: items.at(-1)?.createdAt?.toISOString() ?? null,
  });
});

router.post('/tracks', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDB();
    const { uid, email } = req.user;
    const { title, genre, tags, audioUrl, coverUrl } = req.body;

    if (!audioUrl) return res.status(400).json({ message: 'audioUrl is required' });

    const doc = {
      ownerUid: uid,
      ownerEmail: email,
      title: (title || 'Untitled').trim(),
      genre: genre?.trim() || null,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      audioUrl,
      coverUrl: coverUrl || null,
      isPublished: false,
      plays: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('tracks').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) {
    console.error('[POST]/tracks', e);
    res.status(500).json({ message: 'Failed to create track' });
  }
});

router.post('/tracks/:id/publish', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { uid } = req.user;

  let _id;
  try {
    _id = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: 'Invalid track id' });
  }

  const track = await db.collection('tracks').findOne({ _id });
  if (!track) return res.status(404).json({ message: 'Track not found' });
  if (track.ownerUid !== uid) return res.status(403).json({ message: 'You do not own this track' });

  const { value } = await db.collection('tracks').findOneAndUpdate(
    { _id },
    { $set: { isPublished: true, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  return res.json(value);
});

export default router;
