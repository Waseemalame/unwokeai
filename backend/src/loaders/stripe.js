import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config(); // ensure .env is loaded even if this module is evaluated early

let stripeSingleton = null;

export function getStripe() {
  if (stripeSingleton) return stripeSingleton;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Set it in your environment or .env file.'
    );
  }
  stripeSingleton = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripeSingleton;
}