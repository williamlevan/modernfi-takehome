import { Router } from 'express';
import { yieldsController } from '../controllers/yieldsController';

const router = Router();

/**
 * GET /api/yields
 * Fetches treasury yield data from FRED API
 */
router.get('/', yieldsController.getYields);

export default router;