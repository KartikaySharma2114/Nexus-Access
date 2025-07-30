import { z } from 'zod';

// Permission validation schemas
export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters'),
  description: z.string().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Role validation schemas
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
});

export const updateRoleSchema = createRoleSchema.partial();

// Association validation schemas
export const createAssociationSchema = z.object({
  role_id: z.string().uuid('Invalid role ID'),
  permission_id: z.string().uuid('Invalid permission ID'),
});

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateAssociationInput = z.infer<typeof createAssociationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
