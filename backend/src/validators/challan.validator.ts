import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item must be included in the sales challan'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required').optional(),
  items: z.array(challanItemSchema).min(1, 'At least one item must be included in the sales challan').optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
