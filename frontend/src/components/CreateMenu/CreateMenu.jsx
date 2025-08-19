import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateMenu.css'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M12 5v14m-7-7h14" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function CreateMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="create-menu" ref={menuRef}>
      <button 
        className="create-btn" 
        onClick={() => setOpen(v => !v)}
      >
        Create <PlusIcon />
      </button>

      {open && (
        <div className="create-popover">
          <button onClick={() => goTo('/tracks/new')}>🎵 Create Track</button>
          <button disabled>🎚️ Create Sound Kit</button> {/* placeholder only */}
          <button onClick={() => goTo('/files/upload')}>⏫ Upload Files</button>
        </div>
      )}
    </div>
  );
}
