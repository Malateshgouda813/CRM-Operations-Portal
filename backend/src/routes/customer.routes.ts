import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  addFollowUp,
} from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// List & view customer details (Admin, Sales, Accounts, Warehouse)
router.get('/', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getCustomers);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getCustomerById);
router.get('/:id/follow-ups', authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getFollowUps);

// Mutation routes (Admin, Sales)
router.post('/', authorize(Role.ADMIN, Role.SALES), createCustomer);
router.put('/:id', authorize(Role.ADMIN, Role.SALES), updateCustomer);
router.delete('/:id', authorize(Role.ADMIN, Role.SALES), deleteCustomer);
router.post('/:id/follow-ups', authorize(Role.ADMIN, Role.SALES), addFollowUp);

export default router;
