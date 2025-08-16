import React, { useEffect, useRef } from 'react';
import { useCart } from './cart/CartProvider';

const fmt = (cents) =>
  (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export default function CartPopover({ open, onClose, onCheckout }) {
  const { items, totalCents, remove } = useCart();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cart-pop" ref={ref} role="dialog" aria-modal="true">
      <div className="cart-pop__header">Shopping cart</div>

      {!items.length ? (
        <div className="cart-pop__empty">Your cart is empty.</div>
      ) : (
        <>
          <ul className="cart-pop__list">
            {items.map((i, idx) => (
              <li key={`${i.trackId}:${i.license}:${idx}`} className="cart-pop__item">
                <img
                  className="cart-pop__thumb"
                  src={i.coverUrl || 'https://placehold.co/48x48?text=♪'}
                  alt=""
                />
                <div className="cart-pop__text">
                  <div className="cart-pop__title">{i.title}</div>
                  <div className="cart-pop__meta">License: {i.license?.toUpperCase?.() || 'STANDARD'}</div>
                </div>
                <div className="cart-pop__price">{fmt(i.priceCents)}</div>
                <button
                  className="cart-pop__remove"
                  onClick={() => remove(i.trackId, i.license)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-pop__total">
            <span>Total:</span>
            <strong>{fmt(totalCents)}</strong>
          </div>

          <button
            className="btn btn--cta cart-pop__checkout"
            onClick={onCheckout}
            disabled={!items.length}
          >
            CHECKOUT
          </button>
        </>
      )}
    </div>
  );
}
