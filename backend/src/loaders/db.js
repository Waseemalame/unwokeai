import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

let client;
let db;

export async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DB);

  // light bootstrap that mirrors your current behavior
  await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true }).catch(() => {});
  return db;
}

export function getDB() {
  if (!db) throw new Error('DB not initialized. Call connectDB() first.');
  return db;
}
