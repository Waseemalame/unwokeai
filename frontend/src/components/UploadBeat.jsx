import { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider.jsx';

const MAX_MB = 100;
const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac'];

export default function UploadBeat() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [createdTrack, setCreatedTrack] = useState(null);

  const chooseFile = () => inputRef.current?.click();

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      alert('Please upload an MP3/WAV/FLAC file');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File is larger than ${MAX_MB}MB`);
      return;
    }

    try {
      setStatus('Preparing upload…'); setProgress(5);
      const token = user && (await user.getIdToken());

      // 1) Get SAS
      const { data: sas } = await axios.post(
        '/api/uploads/azure/sas',
        { contentType: file.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2) Upload to Azure
      setStatus('Uploading…'); setProgress(25);
      await fetch(sas.uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file
      });
      setProgress(80);

      // 3) Create track
      setStatus('Saving track…');
      const title = file.name.replace(/\.[^.]+$/, '');
      const { data: track } = await axios.post(
        '/api/tracks',
        { title, genre: null, tags: [], audioUrl: sas.blobUrl, coverUrl: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedTrack(track);
      setProgress(100);
      setStatus('Done! Saved as draft (unpublished).');
    } catch (e) {
      console.error('Upload failed:', e);
      setStatus(e?.response?.data?.message || e?.message || 'Upload failed');
      setProgress(0);
    }
  }, [user]);

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    uploadFile(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    uploadFile(file);
  };

  return (
    <div style={{ maxWidth: 640, margin: '32px auto' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={chooseFile}
        style={{
          border: '2px dashed #888',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          background: dragOver ? '#f7f7f7' : 'transparent',
          cursor: 'pointer'
        }}
      >
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Drag & drop your beat</p>
        <p style={{ marginTop: 8, color: '#666' }}>
          or click to choose an MP3 / WAV / FLAC (max {MAX_MB}MB)
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={chooseFile}>Choose File</button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {status && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 8, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%' }} />
          </div>
          <div style={{ marginTop: 8 }}>{status}</div>
        </div>
      )}

      {createdTrack && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <div><strong>Saved:</strong> {createdTrack.title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{createdTrack.audioUrl}</div>
          <PublishButton trackId={createdTrack._id} />
        </div>
      )}
    </div>
  );
}

function PublishButton({ trackId }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);

  const publish = async () => {
    try {
      setBusy(true);
      const token = user && (await user.getIdToken());
      const { data } = await axios.post(
        `/api/tracks/${trackId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data?.isPublished) setPublished(true);
    } catch (e) {
      console.error('Publish failed', e);
      alert(e?.response?.data?.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  if (published) return <div style={{ marginTop: 8, color: 'green' }}>Published ✅</div>;

  return (
    <button onClick={publish} disabled={busy} style={{ marginTop: 8 }}>
      {busy ? 'Publishing…' : 'Publish'}
    </button>
  );
}
