// src/server.js
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

import { connectDB } from './loaders/db.js';
import webhooksRouter from './routes/webhooks.js';
import publicRouter from './routes/public.js';
import usersRouter from './routes/users.js';
import tracksRouter from './routes/tracks.js';
import uploadsRouter from './routes/uploads.js';
import checkoutRouter from './routes/checkout.js';
import { notFound, errorHandler } from './middleware/error.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// init firebase admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_URL || true }));

// 1) mount stripe webhooks FIRST with raw body (no express.json yet)
app.use('/api', webhooksRouter);

// 2) now enable json for the rest of the app
app.use(express.json());

// 3) connect db before attaching API routes
await connectDB();

// 4) mount normal routers
app.use('/api', publicRouter);
app.use('/api', usersRouter);
app.use('/api', tracksRouter);
app.use('/api', uploadsRouter);
app.use('/api', checkoutRouter);

// 5) static SPA
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 6) errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on', PORT));
