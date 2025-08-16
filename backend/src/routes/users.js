import { Router } from 'express';
import { getDB } from '../loaders/db.js';
import verifyFirebaseToken from '../middleware/authMiddleware.js';

const router = Router();

router.post('/hello', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
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

router.get('/users/:userId/profile', async (req, res) => {
  const db = getDB();
  const user = await db.collection('users').findOne(
    { firebaseUid: req.params.userId },
    { projection: { _id: 0, firebaseUid: 1, email: 1, displayName: 1, avatarUrl: 1, createdAt: 1 } }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export default router;
