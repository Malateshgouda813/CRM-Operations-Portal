import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// All challan routes require authentication
router.use(authenticate);

// List & view challan (Admin, Sales, Accounts, Warehouse)
router.get('/', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getChallans);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getChallanById);

// Create, Update, Confirm, Cancel (Admin, Sales)
router.post('/', authorize(Role.ADMIN, Role.SALES), createChallan);
router.put('/:id', authorize(Role.ADMIN, Role.SALES), updateChallan);
router.post('/:id/confirm', authorize(Role.ADMIN, Role.SALES), confirmChallan);
router.post('/:id/cancel', authorize(Role.ADMIN, Role.SALES), cancelChallan);

export default router;
