import { Router } from 'express';
import { getStockMovements, createStockMovement } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// List movements (Admin, Warehouse, Sales, Accounts)
router.get('/', authorize(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), getStockMovements);

// Create movement (Admin, Warehouse)
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE), createStockMovement);

export default router;
