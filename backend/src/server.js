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
const db = mongo.db(process.env.MONGODB_DB || 'chatApp');

app.get('/api/public', (_req, res) => res.json({ message: 'public' }));

app.post('/api/hello', verifyFirebaseToken, async (req, res) => {
  const users = db.collection('users');
  const { uid, email } = req.user;
  const result = await users.findOneAndUpdate(
    { firebaseUid: uid },
    { $setOnInsert: { email, createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );
  res.set('Cache-Control', 'no-store');
  res.json({ message: `Hello from the backend, ${result.value?.email || email}` });
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
