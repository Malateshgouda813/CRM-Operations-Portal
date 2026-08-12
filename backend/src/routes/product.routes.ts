import { Router } from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Read routes (Admin, Sales, Warehouse, Accounts)
router.get('/', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProducts);
router.get('/categories', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getCategories);
router.get('/:id', authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProductById);

// Mutation routes (Admin, Warehouse)
router.post('/', authorize(Role.ADMIN, Role.WAREHOUSE), createProduct);
router.put('/:id', authorize(Role.ADMIN, Role.WAREHOUSE), updateProduct);
router.delete('/:id', authorize(Role.ADMIN, Role.WAREHOUSE), deleteProduct);

export default router;
