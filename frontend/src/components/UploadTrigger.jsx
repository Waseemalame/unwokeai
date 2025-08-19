import { useState } from 'react';
import UploadModal from './UploadModal/UploadModal';

export default function UploadTrigger({ className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        Upload
      </button>
      <UploadModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
