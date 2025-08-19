// src/routes/files.js
import express from 'express';
import verifyFirebaseToken from '../middleware/authMiddleware.js';
import { getDB } from '../loaders/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/files (list current user's files)
router.get('/files', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
    const files = await db.collection('files')
    .find({ userId: req.user.uid })
    .sort({ createdAt: -1 })
    .toArray();

    const normalized = files.map(f => ({
    id: f._id.toString(),
    filename: f.filename,
    type: f.type,
    size: f.size,
    url: f.url,
    createdAt: f.createdAt,
    expiresAt: f.expiresAt,
    }));

    res.json(normalized);
});

// POST /api/files (add a new file record)
router.post('/files', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { filename, type, size, url } = req.body;

  if (!filename || !url) {
    return res.status(400).json({ error: 'filename and url required' });
  }

  const newFile = {
    userId: req.user.uid,
    filename,
    type,
    size,
    url,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };

  const result = await db.collection('files').insertOne(newFile);
  res.status(201).json({ ...newFile, _id: result.insertedId });
});

// DELETE /api/files/:id (optional)
router.delete('/files/:id', verifyFirebaseToken, async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const result = await db.collection('files').deleteOne({
    _id: new ObjectId(id),
    userId: req.user.uid
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json({ ok: true });
});

export default router;
