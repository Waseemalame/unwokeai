// src/pages/TracksNewPage.jsx
import React, { useState } from "react";
import "./TracksNewPage.css";

export default function TracksNewPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="tracks-new">
      <h1>Create New Track</h1>

      {/* 1. File Upload */}
      <section className="section upload-section">
        <h2>Files for Download & Streaming</h2>
        <div className="upload-boxes">
          <div className="upload-box">Untagged Track (required)</div>
          <div className="upload-box">Tagged Track (optional)</div>
          <div className="upload-box">Track Stems (optional)</div>
        </div>
      </section>

      {/* 2. Artwork + Basic Info */}
      <section className="section">
        <h2>Artwork & Basic Info</h2>
        <div className="artwork-basic">
          <div className="artwork-upload">
            <div className="cover-placeholder">Upload Artwork</div>
            <button>Edit Artwork</button>
          </div>
          <div className="basic-info">
            <input
              type="text"
              placeholder="Track Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. Metadata */}
      <section className="section">
        <h2>Metadata</h2>
        <div className="metadata-grid">
          <input type="text" placeholder="Genre" />
          <input type="text" placeholder="Category" />
          <input type="text" placeholder="Tags (comma-separated)" />
          <input type="number" placeholder="Tempo (BPM)" />
          <input type="date" />
        </div>
      </section>

      {/* 4. Visibility & Preferences */}
      <section className="section">
        <h2>Visibility & Preferences</h2>
        <div className="prefs">
          <select>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <label>
            <input type="checkbox" /> Include for bulk discounts
          </label>
        </div>
      </section>

      {/* 5. Save/Publish */}
      <section className="section actions">
        <button className="btn-secondary">Save Draft</button>
        <button className="btn-primary">Publish</button>
      </section>
    </div>
  );
}
