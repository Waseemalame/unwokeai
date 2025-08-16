import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import { MongoClient, ObjectId } from 'mongodb'; // ← NOTE: added ObjectId
import path from 'path';
import { fileURLToPath } from 'url';
import verifyFirebaseToken from './middleware/authMiddleware.js';

import crypto from 'crypto';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

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

await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true }).catch(() => {});

const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;      // e.g. mystorageacct
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER;  // e.g. audiofiles
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;              // account access key
const sharedKey = (AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY)
  ? new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)
  : null;

app.get('/api/public', (_req, res) => res.json({ message: 'public' }));

app.post('/api/hello', verifyFirebaseToken, async (req, res) => {
  const users = db.collection('users');
  const { uid, email } = req.user;

  const result = await users.findOneAndUpdate(
    { firebaseUid: uid },
    {
      $set: { email },
      $setOnInsert: { firebaseUid: uid, createdAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  res.set('Cache-Control', 'no-store');
  res.json({ message: `Hello from the backend, ${result.value?.email || email}` });
});

app.post('/api/uploads/azure/sas', verifyFirebaseToken, async (req, res) => {
  try {
    if (!sharedKey) return res.status(500).json({ message: 'Storage not configured' });

    const { uid } = req.user;
    const { contentType } = req.body; // 'audio/mpeg', 'audio/wav', 'audio/flac', etc.

    const allowed = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac'];
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ message: 'Unsupported content type' });
    }

    const ext =
      contentType.includes('wav') ? '.wav' :
      contentType.includes('flac') ? '.flac' :
      contentType.includes('mpeg') ? '.mp3' : '';

    const blobName = `${uid}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;

    const startsOn = new Date();
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const sas = generateBlobSASQueryParameters(
      {
        containerName: AZURE_STORAGE_CONTAINER,
        blobName,
        startsOn,
        expiresOn,
        permissions: BlobSASPermissions.parse('cw'),
        protocol: SASProtocol.Https,
      },
      sharedKey
    ).toString();

    const baseUrl = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/${encodeURIComponent(blobName)}`;
    const uploadUrl = `${baseUrl}?${sas}`;

    res.json({
      uploadUrl,
      blobUrl: baseUrl,
    });
  } catch (e) {
    console.error('/api/uploads/azure/sas error', e);
    res.status(500).json({ message: 'Failed to create SAS' });
  }
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

app.post('/api/tracks', verifyFirebaseToken, async (req, res) => {
  try {
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
    console.error('/api/tracks create error', e);
    res.status(500).json({ message: 'Failed to create track' });
  }
});

app.post('/api/tracks/:id/publish', verifyFirebaseToken, async (req, res) => {
  const { uid } = req.user;

  let _id;
  try {
    _id = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: 'Invalid track id' });
  }

  const track = await db.collection('tracks').findOne({ _id });
  if (!track) return res.status(404).json({ message: 'Track not found' });

  if (track.ownerUid !== uid) {
    return res.status(403).json({ message: 'You do not own this track' });
  }

  const { value } = await db.collection('tracks').findOneAndUpdate(
    { _id },
    { $set: { isPublished: true, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  return res.json(value);
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
