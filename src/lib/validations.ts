import { z } from 'zod';

// Base schemas
export const idSchema = z.string().uuid('Invalid ID format');

export const searchSchema = z.object({
  query: z.string().optional().default(''),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Permission schemas
export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Permission name can only contain letters, numbers, underscores, and hyphens'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Role schemas
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Role name can only contain letters, numbers, underscores, and hyphens'
    ),
});

export const updateRoleSchema = createRoleSchema.partial();

// Association schemas
export const createAssociationSchema = z.object({
  role_id: idSchema,
  permission_id: idSchema,
});

export const deleteAssociationSchema = z.object({
  role_id: idSchema,
  permission_id: idSchema,
});

// AI Command schema
export const aiCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
});

// Batch operations
export const batchAssociationSchema = z.object({
  role_id: idSchema,
  permission_ids: z
    .array(idSchema)
    .min(1, 'At least one permission ID is required'),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
