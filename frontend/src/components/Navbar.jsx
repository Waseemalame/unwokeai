import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from './cart/CartProvider.jsx';
import CartPopover from './CartPopover.jsx';
import '../styles/nav.css';

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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const onCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const count = items.length;
  const initials =
    user?.displayName?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ||
    (user?.email ? user.email[0].toUpperCase() : 'U');

  const onLogout = async () => {
    try { await logout(); navigate('/'); } 
    catch (e) { console.error('Logout failed', e); }
  };

  return (
    <header className="site-nav">
      <div className="site-nav__top">
        {/* LEFT SECTION */}
        <div className="site-nav__left">
          <button 
            className="icon-btn mobile-only" 
            aria-label="Menu" 
            onClick={() => setMobileOpen(v => !v)}
          >
            <span className="hamburger" />
          </button>
          <Link to="/" className="brand">
            <span className="brand__logo"><GridIcon /></span>
            <span className="brand__text">Beatflow</span>
          </Link>
          <nav className="links desktop-only">
            <NavLink to="/" end>Feed</NavLink>
            <NavLink to="/tracks">Tracks</NavLink>
            <NavLink to="/collections">Collections</NavLink>
            <NavLink to="/kits">Sound&nbsp;Kits</NavLink>
            <NavLink to="/musicians">Musicians</NavLink>
            <NavLink to="/models">AI&nbsp;Models</NavLink>
          </nav>
        </div>

        {/* CENTER SECTION */}
        <div className="site-nav__center">
          <div className="search">
            <span className="search__icon">⌕</span>
            <input className="search__input" placeholder="Search beats, moods, or artists…" disabled />
            <button className="search__btn" disabled>Search</button>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="site-nav__right">
          {/* CART BUTTON + POPOVER WRAP */}
          <div className="cart-wrap" style={{ position: 'relative' }}>
            <button
              type="button"
              className="icon-btn badge-wrap"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
            >
              <CartIcon />
              {count > 0 && <span className="badge">{count}</span>}
            </button>

            {/* CART POPOVER */}
            <CartPopover
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              onCheckout={onCheckout}
            />
          </div>

          {/* AUTH */}
          {loading ? (
            <div className="auth-actions">
              <span className="link" style={{ opacity: .7 }}>Loading…</span>
            </div>
          ) : !user ? (
            <div className="auth-actions">
              <Link to="/login" className="link">Sign up</Link><span className="sep">|</span>
              <Link to="/login" className="link">Sign in</Link>
              <Link to="/upload" className="cta">Start Selling</Link>
            </div>
          ) : (
            <div className="user-menu">
              <button 
                className="avatar" 
                onClick={() => navigate('/me')} 
                title={user.displayName || user.email}
              >
                {initials}
              </button>
              <button className="ghost" onClick={onLogout}>Sign out</button>
            </div>
          )}
        </div>
      </div>

      {/* SUB NAV */}
      <div className="site-nav__sub desktop-only">
        <Link to="/tracks">Tracks</Link>
        <Link to="/collections">Collections</Link>
        <Link to="/kits">Sound Kits</Link>
        <Link to="/musicians">Musicians</Link>
        <Link to="/models">AI Models</Link>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="mobile-panel">
          <nav className="mobile-links">
            <NavLink to="/" end onClick={() => setMobileOpen(false)}>Feed</NavLink>
            <NavLink to="/tracks" onClick={() => setMobileOpen(false)}>Tracks</NavLink>
            <NavLink to="/collections" onClick={() => setMobileOpen(false)}>Collections</NavLink>
            <NavLink to="/kits" onClick={() => setMobileOpen(false)}>Sound Kits</NavLink>
            <NavLink to="/musicians" onClick={() => setMobileOpen(false)}>Musicians</NavLink>
            <NavLink to="/models" onClick={() => setMobileOpen(false)}>AI Models</NavLink>
          </nav>
          <div className="mobile-auth">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="cta wide">Sign in / up</Link>
                <Link to="/upload" onClick={() => setMobileOpen(false)} className="ghost wide">Start Selling</Link>
              </>
            ) : (
              <>
                <Link to="/me" onClick={() => setMobileOpen(false)} className="ghost wide">My Profile</Link>
                <button className="ghost wide" onClick={onLogout}>Sign out</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
