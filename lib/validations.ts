import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatar: z.string().max(4, 'Avatar must be a single emoji or character').optional(),
});

// Wallet schemas
export const createWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(100, 'Wallet name cannot exceed 100 characters'),
  icon: z.string().min(1, 'Icon is required').max(4, 'Icon must be a single character or emoji'),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Background color must be a valid hex color'),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(100, 'Wallet name cannot exceed 100 characters'),
  icon: z.string().min(1, 'Icon is required').max(4, 'Icon must be a single character or emoji'),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Background color must be a valid hex color'),
});

// Wallet entry schemas
export const createWalletEntrySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['add', 'subtract'], { message: 'Type must be either add or subtract' }),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed per entry').optional(),
});

// Query params schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const walletEntriesQuerySchema = paginationSchema.extend({
  walletId: z.string().min(1, 'Wallet ID is required'),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type CreateWalletEntryInput = z.infer<typeof createWalletEntrySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type WalletEntriesQueryInput = z.infer<typeof walletEntriesQuerySchema>;