import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import verifyFirebaseToken from './middleware/authMiddleware.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const app = express()
  .use(cors({ origin: process.env.FRONTEND_URL || true }))
  .use(express.json());

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();
const db = mongo.db(process.env.MONGODB_DB);

app.get('/api/public', (_req, res) => res.json({ message: 'public' }));

app.post('/api/hello', verifyFirebaseToken, async (req, res) => {
  const users = db.collection('users');
  const { uid, email } = req.user;

  const result = await users.findOneAndUpdate(
    { firebaseUid: uid },
    {
      // keep mutable fields current
      $set: { email },
      // write once on first insert
      $setOnInsert: { firebaseUid: uid, createdAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  res.set('Cache-Control', 'no-store');
  res.json({ message: `Hello from the backend, ${result.value?.email || email}` });
});

app.get('/api/tracks', async (req, res) => {
  try {
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
      nextCursor: items.at(-1)?.createdAt?.toISOString() ?? null
    });
  } catch (err) {
    console.error('/api/tracks error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:userId/profile', async (req, res) => {
  const user = await db.collection('users').findOne(
    { firebaseUid: req.params.userId },
    { projection: { _id: 0, firebaseUid: 1, email: 1, displayName: 1, avatarUrl: 1, createdAt: 1 } }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// User's published tracks
app.get('/api/users/:userId/tracks', async (req, res) => {
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
    nextCursor: items.at(-1)?.createdAt?.toISOString() ?? null
  });
});

app.post('/api/tracks/:id/publish', verifyFirebaseToken, async (req, res) => {
  const { uid } = req.user;
  const _id = new ObjectId(req.params.id);
  const result = await db.collection('tracks').findOneAndUpdate(
    { _id, ownerUid: uid },
    { $set: { isPublished: true } },
    { returnDocument: 'after' }
  );
  if (!result.value) return res.status(404).end();
  res.json(result.value);
});

// Serve the SPA build
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(process.env.PORT || 5000, () =>
  console.log('Server running on', process.env.PORT || 5000)
);
