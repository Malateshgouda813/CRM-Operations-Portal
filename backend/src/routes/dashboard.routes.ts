import { Router } from 'express';
import { getDashboardStats, getDashboardActivity } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getDashboardActivity);

export default router;
