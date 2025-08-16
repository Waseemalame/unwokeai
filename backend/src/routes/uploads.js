import { Router } from 'express';
import verifyFirebaseToken from '../middleware/authMiddleware.js';
import { buildAudioUploadSAS, isAzureConfigured } from '../utils/azureSas.js';

const router = Router();

router.post('/uploads/azure/sas', verifyFirebaseToken, async (req, res) => {
  try {
    if (!isAzureConfigured()) return res.status(500).json({ message: 'Storage not configured' });
    const { uid } = req.user;
    const { contentType } = req.body;
    const { uploadUrl, blobUrl } = buildAudioUploadSAS(uid, contentType);
    res.json({ uploadUrl, blobUrl });
  } catch (e) {
    console.error('[POST]/uploads/azure/sas', e);
    res.status(e.status || 500).json({ message: e.message || 'Failed to create SAS' });
  }
});

export default router;
