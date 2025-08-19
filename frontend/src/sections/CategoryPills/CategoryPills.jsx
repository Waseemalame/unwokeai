import React from 'react';
import './CategoryPills.css'; // Import styles for CategoryPills

const items = [
  { key: 'new', label: 'New & Notable', icon: '✨' },
  { key: 'charts', label: 'Top Charts', icon: '📈' },
  { key: 'exclusive', label: 'Exclusive Only', icon: '🔒' },
  { key: 'under20', label: 'Under $20', icon: '💵' },
  { key: 'free', label: 'Free Beats', icon: '🎁' },
  { key: 'beats', label: 'Beats', icon: '🎧' },
  { key: 'hook', label: 'Beats w/ Hook', icon: '🎤' }
];

export default function CategoryPills() {
  return (
    <div className="category-pills" aria-label="Explore categories">
      {items.map((it) => (
        <button key={it.key} className="pill" title={`${it.label} (coming soon)`}>
          <span className="pill__icon" aria-hidden>{it.icon}</span>
          <span className="pill__label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
