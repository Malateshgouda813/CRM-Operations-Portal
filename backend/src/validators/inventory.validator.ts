import { z } from 'zod';
import { MovementType } from '../types';

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
  type: z.nativeEnum(MovementType, {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' }),
  }),
  reason: z.string().min(3, 'Reason for movement must be at least 3 characters'),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
