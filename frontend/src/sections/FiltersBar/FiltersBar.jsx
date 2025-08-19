import React, { useState } from 'react';
import './FiltersBar.css'; // Import styles for FiltersBar

function FakeDropdown({ label }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faux-dd ${open ? 'is-open' : ''}`}>
      <button className="faux-dd__btn" onClick={() => setOpen((v) => !v)}>
        {label} <span className="caret">▾</span>
      </button>
      {open && (
        <div className="faux-dd__menu">
          <div className="faux-dd__item">Coming soon</div>
        </div>
      )}
    </div>
  );
}

export default function FiltersBar() {
  return (
    <div className="filters">
      {/* Desktop filters */}
      <div className="filters__desktop">
        <FakeDropdown label="All time" />
        <FakeDropdown label="Genre" />
        <FakeDropdown label="Track Type" />
        <FakeDropdown label="Price" />
        <FakeDropdown label="Mood" />
        <FakeDropdown label="BPM" />
        <FakeDropdown label="Instruments" />
        <FakeDropdown label="Key" />
        <FakeDropdown label="Duration" />
        <FakeDropdown label="Energy" />
      </div>

      {/* Mobile: just one button */}
      <div className="filters__mobile">
        <button className="more-filters-btn">More Filters</button>
      </div>

      <div className="filters__spacer" />

      <div className="filters__view">
        <button aria-label="List view" className="icon-btn" title="List view">☰</button>
        <button aria-label="Grid view" className="icon-btn" title="Grid view">▦</button>
      </div>
    </div>
  );
}
