import React, { useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../components/cart/CartProvider.jsx';
import '../styles/checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const fmt = (cents) =>
  (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export default function CheckoutPage() {
  const { items, totalCents, remove } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const groups = useMemo(
    () => [{ sellerName: items.length ? (items[0].sellerName || 'Cart') : 'Cart', items }],
    [items]
  );

  const onRemove = (i) => remove(i.trackId, i.license);

  const onContinueToPayment = useCallback(async () => {
    if (!items.length) return;

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      if (!user) {
        navigate('/login');
        throw new Error('Must be signed in to checkout');
      }
      const token = await user.getIdToken(true);

      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({
            trackId: i.trackId,
            license: i.license || 'mp3',
          })),
        }),
      });

      if (res.status === 401) {
        navigate('/login');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.id) await stripe.redirectToCheckout({ sessionId: data.id });
      else throw new Error('No session url/id returned');
    } catch (err) {
      console.error('Checkout error', err);
      alert('Create session failed: ' + err.message);
    }
  }, [items, user, navigate]);

  if (!items.length) {
    return (
      <div className="checkout wrap">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p><Link to="/">Go find some beats →</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout wrap">
      {/* Left: Items */}
      <section className="co-left card">
        <h2 className="co-title">Items</h2>

        {groups.map((g, gi) => (
          <div key={gi} className="co-group">
            <div className="co-seller">
              <div className="co-avatar" aria-hidden />
              <div>
                <div className="co-seller-name">{g.sellerName}</div>
                <div className="co-seller-sub">{g.items.length} item{g.items.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            <ul className="co-list">
              {g.items.map((it, idx) => (
                <li key={`${it.trackId}:${it.license}:${idx}`} className="co-item">
                  <img className="co-thumb" src={it.coverUrl || 'https://placehold.co/56x56?text=♪'} alt="" />
                  <div className="co-item-text">
                    <div className="co-item-title">{it.title}</div>
                    <div className="co-item-meta">License: {it.license?.toUpperCase?.() || 'STANDARD'}</div>
                  </div>
                  <div className="co-price">{fmt(it.priceCents)}</div>
                  <button className="co-remove" onClick={() => onRemove(it)} aria-label="Remove">⋯</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Right: Summary */}
      <aside className="co-right card">
        <h3 className="co-summary-title">Cart Summary</h3>

        <div className="co-row">
          <span>Discount</span>
          <strong>-{fmt(0)}</strong>
        </div>
        <div className="co-row co-total">
          <span>Total</span>
          <strong>{fmt(totalCents)}</strong>
        </div>

        <button className="co-cta" disabled={loading || !user} onClick={onContinueToPayment}>
          🛒  CONTINUE TO PAYMENT
        </button>

        <div className="co-block">
          <div className="co-block-title">Coupons</div>
          <div className="co-coupon">
            <input className="co-input" placeholder="Coupon code" disabled />
            <button className="co-ghost" disabled>APPLY</button>
          </div>
        </div>

        <div className="co-block">
          <div className="co-block-title">Share cart</div>
          <div className="co-share">
            <input className="co-input" value={window.location.href} readOnly />
            <button className="co-ghost" onClick={() => navigator.clipboard.writeText(window.location.href)}>SHARE</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
