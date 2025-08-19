import { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider.jsx';

const MAX_MB = 100;
const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac'];
const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

export default function UploadBeat() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const coverRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    genre: '',
    category: '',
    tags: '',
    tempo: '',
    releaseDate: '',
    coverFile: null,
    coverPreview: null,
    audioTagOption: 'none',
  });

  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [createdTrack, setCreatedTrack] = useState(null);

  const chooseFile = () => inputRef.current?.click();
  const chooseCover = () => coverRef.current?.click();

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

      // 1) Get SAS for audio
      const { data: sas } = await axios.post(
        '/api/uploads/azure/sas',
        { contentType: file.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2) Upload audio file
      setStatus('Uploading…'); setProgress(25);
      await fetch(sas.uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file
      });
      setProgress(70);

      // (Optional) upload cover image if exists
      let coverUrl = null;
      if (form.coverFile) {
        const { data: coverSas } = await axios.post(
          '/api/uploads/azure/sas',
          { contentType: form.coverFile.type },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetch(coverSas.uploadUrl, {
          method: 'PUT',
          headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': form.coverFile.type },
          body: form.coverFile
        });
        coverUrl = coverSas.blobUrl;
      }

      // 3) Create track w/ metadata
      setStatus('Saving track…');
      const { data: track } = await axios.post(
        '/api/tracks',
        {
          title: form.title || file.name.replace(/\.[^.]+$/, ''),
          genre: form.genre || null,
          category: form.category || null,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
          tempo: form.tempo || null,
          releaseDate: form.releaseDate || null,
          audioUrl: sas.blobUrl,
          coverUrl,
          audioTagOption: form.audioTagOption
        },
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
  }, [user, form]);

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

  const onCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file && ACCEPTED_IMAGE.includes(file.type)) {
      setForm({
        ...form,
        coverFile: file,
        coverPreview: URL.createObjectURL(file)
      });
    }
  };

  return (
    <div className="upload-grid">
      {/* Top row: audio + cover */}
      <div className="upload-top">
        <div
          className={`upload-audio ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={chooseFile}
        >
          <p>🎵 Drag & drop your beat</p>
          <p className="sub">or click to choose MP3 / WAV / FLAC (max {MAX_MB}MB)</p>
        </div>

        <div className="upload-cover">
          <div className="cover-preview">
            {form.coverPreview ? (
              <img src={form.coverPreview} alt="Cover" />
            ) : (
              <div className="placeholder">No cover</div>
            )}
          </div>
          <button type="button" onClick={chooseCover}>Choose Image</button>
          <input
            ref={coverRef}
            type="file"
            accept={ACCEPTED_IMAGE.join(',')}
            onChange={onCoverChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="upload-title">
        <label>Track Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
      </div>

      {/* Meta row */}
      <div className="upload-meta-row">
        <label>
          Genre
          <input
            type="text"
            value={form.genre}
            onChange={e => setForm({ ...form, genre: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            type="text"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          Tempo (BPM)
          <input
            type="number"
            value={form.tempo}
            onChange={e => setForm({ ...form, tempo: e.target.value })}
          />
        </label>
        <label>
          Release Date
          <input
            type="date"
            value={form.releaseDate}
            onChange={e => setForm({ ...form, releaseDate: e.target.value })}
          />
        </label>
      </div>

      {/* Tags */}
      <div className="upload-tags">
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={e => setForm({ ...form, tags: e.target.value })}
        />
      </div>

      {/* Audio tagging placeholder */}
      <fieldset className="upload-audio-tag">
        <legend>Audio Tagging (optional)</legend>
        <label><input type="radio" value="none" checked={form.audioTagOption==='none'} onChange={e => setForm({...form,audioTagOption:e.target.value})}/> No audio tag</label>
        <label><input type="radio" value="existing" checked={form.audioTagOption==='existing'} onChange={e => setForm({...form,audioTagOption:e.target.value})}/> Already watermarked</label>
        <label><input type="radio" value="record" checked={form.audioTagOption==='record'} onChange={e => setForm({...form,audioTagOption:e.target.value})}/> Record a tag (future)</label>
        <label><input type="radio" value="sample" checked={form.audioTagOption==='sample'} onChange={e => setForm({...form,audioTagOption:e.target.value})}/> Use sample tag (future)</label>
      </fieldset>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      {/* Progress + status */}
      {status && (
        <div className="upload-progress">
          <div className="bar" style={{ width: `${progress}%` }} />
          <p>{status}</p>
        </div>
      )}

      {createdTrack && (
        <div className="upload-result">
          <div><strong>Saved:</strong> {createdTrack.title}</div>
          <div className="url">{createdTrack.audioUrl}</div>
          <PublishButton trackId={createdTrack._id} />
        </div>
      )}

      <style jsx>{`
        .upload-grid { display: flex; flex-direction: column; gap: 16px; max-height: 70vh; overflow-y: auto; }
        .upload-top { display: flex; gap: 20px; }
        .upload-audio {
          flex: 2; border: 2px dashed #888; border-radius: 12px; padding: 24px;
          text-align: center; cursor: pointer; transition: background 0.2s;
        }
        .upload-audio.drag-over { background: #f7f7f7; }
        .upload-audio p { margin: 0; font-weight: 600; }
        .upload-audio .sub { font-size: 0.85rem; color: #666; font-weight: normal; margin-top: 6px; }
        .upload-cover { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .cover-preview { width: 120px; height: 120px; border-radius: 8px; background: #eee; overflow: hidden; display:flex;align-items:center;justify-content:center; }
        .cover-preview img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder { font-size: 0.8rem; color: #777; }
        .upload-title input, .upload-meta-row input, .upload-tags input { width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 6px; }
        .upload-meta-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 12px; }
        .upload-audio-tag { border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-size: 0.9rem; }
        .upload-audio-tag label { display:block; margin: 4px 0; }
        .upload-progress { margin-top: 8px; }
        .upload-progress .bar { height: 6px; background: #f4a62a; border-radius: 3px; }
        .upload-result { padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-top: 10px; font-size: 0.9rem; }
        .upload-result .url { font-size: 0.75rem; color: #666; }
      `}</style>
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
