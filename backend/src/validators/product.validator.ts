import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .transform((val) => val.trim().toUpperCase()),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
  currentStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').optional().default(0),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative').optional().default(0),
  location: z.string().min(1, 'Warehouse location is required'),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
