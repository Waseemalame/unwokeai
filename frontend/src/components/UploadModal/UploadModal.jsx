// src/components/UploadModal/UploadModal.jsx
import { useState } from "react";
import "./UploadModal.css";
import { useAuth } from "../../auth/AuthProvider";

export default function UploadModal({ onClose, onUploaded }) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState([]);   // store multiple files
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);

    const token = await getToken();

    // upload files one by one
    const uploaded = [];
    for (const file of files) {
      const mockUrl = URL.createObjectURL(file);

      const res = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          type: file.type.startsWith("audio") ? "audio" : "image",
          size: file.size,
          url: mockUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) uploaded.push(data);
      else alert(data.error || `Upload failed for ${file.name}`);
    }

    setLoading(false);

    // return all uploaded files to parent
    uploaded.forEach((f) => onUploaded(f));
    onClose();
  };

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div
        className="upload-modal"
        onClick={(e) => e.stopPropagation()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <header className="upload-modal-header">
          <h2>Upload file</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="upload-dropzone">
          <p>
            Drop files here, <label className="browse-link">
              <input type="file" multiple hidden onChange={handleFileChange} />
              browse files
            </label>{" "}
            or import from:
          </p>

          <div className="upload-options">
            <div className="option"><span className="icon">📁</span> My Device</div>
            <div className="option"><span className="icon">☁️</span> Dropbox</div>
            <div className="option"><span className="icon">🔗</span> Link</div>
          </div>

          <p className="hint">
            You can upload files in .zip, .rar, .wav, or .mp3 formats.
          </p>
        </div>

        {files.length > 0 && (
          <ul className="file-preview-list">
            {files.map((f, idx) => (
              <li key={idx}>
                {f.name} ({Math.round(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        )}

        <footer className="actions">
          <button disabled={files.length === 0 || loading} onClick={handleUpload}>
            {loading ? "Uploading…" : "Upload"}
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}
