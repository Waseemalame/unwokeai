import { Router } from 'express';
import { ObjectId } from 'mongodb';
import verifyFirebaseToken from '../middleware/authMiddleware.js';
import { getDB } from '../loaders/db.js';
import { getStripe } from '../loaders/stripe.js';
import getBaseUrl from '../utils/getBaseUrl.js';
import priceFor from '../utils/priceFor.js';

const router = Router();

router.post('/checkout/sessions', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDB();
    const { uid, email } = req.user;
    const { items } = req.body; // [{ trackId, license }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items' });
    }

    const ids = items
      .map(i => {
        try { return new ObjectId(String(i.trackId)); } catch { return null; }
      })
      .filter(Boolean);

    const tracks = await db.collection('tracks').find({ _id: { $in: ids } }).toArray();
    const byId = new Map(tracks.map(t => [String(t._id), t]));

    const line_items = items.map(i => {
      const t = byId.get(String(i.trackId));
      if (!t) throw new Error(`Track not found: ${i.trackId}`);
      const unit_amount = priceFor(t, i.license);

      return {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount,
          product_data: {
            name: `${t.title} — ${(i.license || 'mp3').toUpperCase()}`,
            images: t.coverUrl ? [t.coverUrl] : undefined,
            metadata: {
              trackId: String(t._id),
              ownerUid: t.ownerUid || '',
              license: String(i.license || 'mp3'),
            },
          },
        },
      };
    });

    const base = getBaseUrl(req);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: uid,
      line_items,
      allow_promotion_codes: true,
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      payment_intent_data: {
        metadata: { userUid: uid },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[POST]/checkout/sessions', err);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

export default router;
