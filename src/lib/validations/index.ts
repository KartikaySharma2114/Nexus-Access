import { z } from 'zod';

// Permission validation schemas
export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      'Permission name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    )
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
  description: z
    .string()
    .optional()
    .transform((val) => val?.trim() || null),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Role validation schemas
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      'Role name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    )
    .transform((val) => val.trim().replace(/\s+/g, ' ')),
});

export const updateRoleSchema = createRoleSchema.partial();

// Association validation schemas
export const createAssociationSchema = z.object({
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  permission_id: z.string().uuid({ message: 'Invalid permission ID' }),
});

export const deleteAssociationSchema = z.object({
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  permission_id: z.string().uuid({ message: 'Invalid permission ID' }),
});

// Bulk association schemas
export const bulkCreateAssociationsSchema = z.object({
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  permission_ids: z
    .array(z.string().uuid({ message: 'Invalid permission ID' }))
    .min(1, 'At least one permission is required'),
});

export const bulkDeleteAssociationsSchema = z.object({
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  permission_ids: z
    .array(z.string().uuid({ message: 'Invalid permission ID' }))
    .min(1, 'At least one permission is required'),
});

// User role validation schemas
export const createUserRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID' }),
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
});

export const deleteUserRoleSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID' }),
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
});

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Search and filter validation schemas
export const searchSchema = z.object({
  query: z
    .string()
    .optional()
    .transform((val) => val?.trim() || ''),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

// ID validation schema
export const idSchema = z.string().uuid({ message: 'Invalid ID format' });

// Array of IDs validation schema
export const idsSchema = z
  .array(z.string().uuid({ message: 'Invalid ID format' }))
  .min(1, 'At least one ID is required');

// Natural language command validation (for future AI integration)
export const naturalLanguageCommandSchema = z.object({
  command: z
    .string()
    .min(1, 'Command is required')
    .max(500, 'Command is too long'),
  context: z
    .object({
      permissions: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
});

// Export inferred types
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateAssociationInput = z.infer<typeof createAssociationSchema>;
export type DeleteAssociationInput = z.infer<typeof deleteAssociationSchema>;
export type BulkCreateAssociationsInput = z.infer<
  typeof bulkCreateAssociationsSchema
>;
export type BulkDeleteAssociationsInput = z.infer<
  typeof bulkDeleteAssociationsSchema
>;
export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;
export type DeleteUserRoleInput = z.infer<typeof deleteUserRoleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type IdInput = z.infer<typeof idSchema>;
export type IdsInput = z.infer<typeof idsSchema>;
export type NaturalLanguageCommandInput = z.infer<
  typeof naturalLanguageCommandSchema
>;

// Validation utility functions
export function validatePermissionName(name: string): boolean {
  return createPermissionSchema.shape.name.safeParse(name).success;
}

export function validateRoleName(name: string): boolean {
  return createRoleSchema.shape.name.safeParse(name).success;
}

export function validateUUID(id: string): boolean {
  return idSchema.safeParse(id).success;
}

export function validateEmail(email: string): boolean {
  return z.string().email({ message: 'Invalid email' }).safeParse(email)
    .success;
}

// Safe parsing utilities with error handling
export function safeParsePermission(data: unknown) {
  return createPermissionSchema.safeParse(data);
}

export function safeParseRole(data: unknown) {
  return createRoleSchema.safeParse(data);
}

export function safeParseAssociation(data: unknown) {
  return createAssociationSchema.safeParse(data);
}

export function safeParseLogin(data: unknown) {
  return loginSchema.safeParse(data);
}
