import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__logo">Studio</h2>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          <p className="sidebar__section-title">Content</p>
          <NavLink to="/files" className="sidebar__link">
            File Storage
          </NavLink>
          <NavLink to="/tracks" className="sidebar__link">
            Tracks
          </NavLink>
          <NavLink to="/collections" className="sidebar__link">
            Collections
          </NavLink>
          <NavLink to="/soundkits" className="sidebar__link">
            Sound Kits
          </NavLink>
          <NavLink to="/videos" className="sidebar__link">
            Videos
          </NavLink>
          <NavLink to="/photos" className="sidebar__link">
            Photos
          </NavLink>
        </div>

        <div className="sidebar__section">
          <p className="sidebar__section-title">Monetization</p>
          <NavLink to="/publishing" className="sidebar__link">
            Publishing
          </NavLink>
          <NavLink to="/beat-id" className="sidebar__link">
            Beat ID
          </NavLink>
        </div>

        <div className="sidebar__section">
          <p className="sidebar__section-title">Performance</p>
          <NavLink to="/sales" className="sidebar__link">
            Sales
          </NavLink>
          <NavLink to="/analytics" className="sidebar__link">
            Analytics
          </NavLink>
        </div>

        <div className="sidebar__section">
          <p className="sidebar__section-title">Creator Tools</p>
          <NavLink to="/promote" className="sidebar__link">
            Promote
          </NavLink>
          <NavLink to="/discounts" className="sidebar__link">
            Discounts
          </NavLink>
          <NavLink to="/contracts" className="sidebar__link">
            Contracts
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
