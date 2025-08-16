import { Router } from 'express';
const router = Router();

router.get('/public', (_req, res) => res.json({ message: 'public' }));

export default router;
