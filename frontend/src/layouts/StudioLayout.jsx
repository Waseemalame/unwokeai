// src/layouts/StudioLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar/Sidebar.jsx';

export default function StudioLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
    </div>
  );
}
