import { Router, json, raw } from 'express';
import { getDB } from '../loaders/db.js';
import { getStripe } from '../loaders/stripe.js';

const router = Router();

// Use raw body on this route only (Stripe requires the exact raw payload)
router.post('/webhooks/stripe', raw({ type: 'application/json' }), async (req, res) => {
  try {
    const db = getDB();
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    let event;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        await db.collection('orders').insertOne({
          stripeSessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email || session.customer_email || null,
          paymentStatus: session.payment_status,
          clientReferenceId: session.client_reference_id || null,
          createdAt: new Date(),
          metadata: session.metadata || {},
        });

        break;
      }
      default:
        // handle other events as needed
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// export a helper to re-enable JSON parsing for any sub-routes if needed
export const reenableJson = json();
export default router;
