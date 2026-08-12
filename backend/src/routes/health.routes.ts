import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { ENV } from '../config/env';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: ENV.NODE_ENV,
      version: '1.0.0',
    },
    'Mini ERP + CRM API is healthy and operational'
  );
});

export default router;
