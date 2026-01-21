import { Router } from 'express';
import { yieldsController } from '../controllers/yieldsController';

const router = Router();

router.get('/', yieldsController.getYields);

export default router;