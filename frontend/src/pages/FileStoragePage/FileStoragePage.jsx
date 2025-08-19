// src/pages/FileStoragePage/FileStoragePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FileStoragePage.css";
import UploadModal from "../../components/UploadModal/UploadModal";
import { useAuth } from "../../auth/AuthProvider";

export default function FileStoragePage() {
  const { getToken } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // fetch files on mount
  useEffect(() => {
    async function loadFiles() {
      try {
        const token = await getToken();
        const res = await fetch("/api/files", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setFiles(data || []);
      } catch (err) {
        console.error("Failed to load files", err);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, [getToken]);

  // check query params (auto-open modal if ?create=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      setShowModal(true);
    }
  }, [location]);

  const handleUploaded = (newFile) => {
    setFiles((prev) => [newFile, ...prev]); // add to top of list
  };

  const handleCloseModal = () => {
    setShowModal(false);

    // 🔥 remove ?create=true from URL so modal doesn’t auto-open again
    const params = new URLSearchParams(location.search);
    if (params.has("create")) {
      params.delete("create");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true }
      );
    }
  };

  return (
    <div className="file-storage-page">
      <header className="fsp-header">
        <h1>File Storage</h1>
        <button className="upload-btn" onClick={() => setShowModal(true)}>
          Upload files
        </button>
      </header>

      <div className="fsp-banner">
        Be sure to use your files before they expire. You can upload as many as you want,
        but they’ll be removed automatically after 30 days.
      </div>

      <div className="fsp-controls">
        <input type="text" placeholder="Start typing to search..." />
        <div className="sort-controls">
          <select>
            <option>Newest first</option>
            <option>Oldest first</option>
          </select>
          <select>
            <option>Type All</option>
            <option>Audio</option>
            <option>Image</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="fsp-loading">Loading files…</div>
      ) : files.length === 0 ? (
        <div className="fsp-empty">No files uploaded yet.</div>
      ) : (
        <div className="file-list grid">
          {files.map((file) => (
            <div key={file._id} className="file-card">
              <div className="file-thumb">
                {file.type === "audio" ? (
                  <img
                    src="https://i.imgur.com/SzdnIzj.png"
                    alt="Audio file"
                    className="file-fallback"
                  />
                ) : file.type === "image" ? (
                  <img src={file.url} alt={file.filename} />
                ) : (
                  <span className="file-icon">📄</span>
                )}
              </div>
              <div className="file-meta">
                <div className="file-name">{file.filename}</div>
                <div className="file-info">
                  {file.size} • {file.expiresAt ? new Date(file.expiresAt).toLocaleDateString() : "No expiry"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <UploadModal onClose={handleCloseModal} onUploaded={handleUploaded} />
      )}
    </div>
  );
}

