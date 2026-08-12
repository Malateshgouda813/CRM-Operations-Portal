import { z } from 'zod';
import { CustomerType, CustomerStatus } from '../types';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(5, 'Valid contact number is required'),
  email: z.string().email('Invalid email address format'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().trim().optional().nullable(),
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR' }),
  }),
  address: z.string().min(3, 'Address is required'),
  status: z.nativeEnum(CustomerStatus, {
    errorMap: () => ({ message: 'Status must be LEAD, ACTIVE, or INACTIVE' }),
  }).optional().default(CustomerStatus.LEAD),
  followUpDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(2, 'Follow-up note cannot be empty'),
  followUpDate: z.string().min(1, 'Follow-up date is required').transform((val) => new Date(val)),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
