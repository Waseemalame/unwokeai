import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';
import CartPopover from '../CartPopover.jsx';
import './Navbar.css';

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h-.8a1 1 0 0 0 0 2H7l1.2 9.4A2.5 2.5 0 0 0 10.7 18h6.6a2.5 2.5 0 0 0 2.5-2.2l.9-7.3A1 1 0 0 0 19.7 7H8.6l-.2-1.6A1.8 1.8 0 0 0 6.7 4H7zM10 20.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0zm9 0a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0z"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { items } = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const count = items.length;
  const initials =
    user?.displayName?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ||
    (user?.email ? user.email[0].toUpperCase() : 'U');

  const onLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <header className="site-nav">
      <div className="site-nav__top">

        {/* LEFT SECTION */}
        <div className="site-nav__left">
          <Link to="/" className="brand">
            <span className="brand__logo"><GridIcon /></span>
            <span className="brand__text">Beatflow</span>
          </Link>
        </div>

        {/* CENTER (desktop search only) */}
        <div className="site-nav__center desktop-only">
          <div className="search">
            <span className="search__icon">⌕</span>
            <input className="search__input" placeholder="Search beats, moods, or artists…" />
            <button className="search__btn">Search</button>
          </div>
        </div>

        {/* RIGHT (desktop only) */}
        <div className="site-nav__right desktop-only">
          {/* Cart */}
          <div className="cart-wrap" style={{ position: 'relative' }}>
            <button
              type="button"
              className="icon-btn"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
            >
              <CartIcon />
              {count > 0 && <span className="badge">{count}</span>}
            </button>
            <CartPopover
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              onCheckout={() => navigate('/checkout')}
            />
          </div>

          {/* Avatar / Login */}
          {!loading && user ? (
            <div className="user-menu">
              <button className="avatar" onClick={() => navigate('/me')}>{initials}</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="link">Sign up</Link>
              <span className="sep">|</span>
              <Link to="/login" className="link">Sign in</Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile only, outside desktop-only) */}
        <button
          className="nav-toggle mobile-only"
          onClick={() => setMenuOpen(o => !o)}
        >
          ☰
        </button>
      </div>

      {/* MOBILE PANEL */}
      {menuOpen && (
        <div className="mobile-panel open">
          <div className="search">
            <span className="search__icon">⌕</span>
            <input className="search__input" placeholder="Search beats, moods, or artists…" />
            <button className="search__btn">Search</button>
          </div>

          <div className="mobile-auth">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="cta wide">Sign in / up</Link>
              </>
            ) : (
              <>
                <Link to="/me" onClick={() => setMenuOpen(false)} className="ghost wide">My Profile</Link>
                <button className="ghost wide" onClick={onLogout}>Sign out</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
