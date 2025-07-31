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

// Enhanced validation utility functions
export function validatePermissionName(name: string): {
  isValid: boolean;
  error?: string;
} {
  const result = createPermissionSchema.shape.name.safeParse(name);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

export function validateRoleName(name: string): {
  isValid: boolean;
  error?: string;
} {
  const result = createRoleSchema.shape.name.safeParse(name);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

export function validateUUID(id: string): { isValid: boolean; error?: string } {
  const result = idSchema.safeParse(id);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const result = z
    .string()
    .email({ message: 'Invalid email' })
    .safeParse(email);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

// Enhanced safe parsing utilities with detailed error information
export function safeParsePermission(data: unknown) {
  const result = createPermissionSchema.safeParse(data);
  return {
    ...result,
    errors: result.success
      ? []
      : result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
  };
}

export function safeParseRole(data: unknown) {
  const result = createRoleSchema.safeParse(data);
  return {
    ...result,
    errors: result.success
      ? []
      : result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
  };
}

export function safeParseAssociation(data: unknown) {
  const result = createAssociationSchema.safeParse(data);
  return {
    ...result,
    errors: result.success
      ? []
      : result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
  };
}

export function safeParseLogin(data: unknown) {
  const result = loginSchema.safeParse(data);
  return {
    ...result,
    errors: result.success
      ? []
      : result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
  };
}

// Batch validation utilities
export function validateMultiple<T>(
  items: unknown[],
  schema: z.ZodSchema<T>
): {
  validItems: T[];
  invalidItems: Array<{
    index: number;
    errors: Array<{ field: string; message: string; code: string }>;
  }>;
  isAllValid: boolean;
} {
  const validItems: T[] = [];
  const invalidItems: Array<{
    index: number;
    errors: Array<{ field: string; message: string; code: string }>;
  }> = [];

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      invalidItems.push({
        index,
        errors: result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      });
    }
  });

  return {
    validItems,
    invalidItems,
    isAllValid: invalidItems.length === 0,
  };
}

// Real-time validation helpers
export function createFieldValidator<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>
) {
  return (fieldName: keyof T, value: unknown) => {
    try {
      const fieldSchema = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>)
        .shape[fieldName as string];
      if (!fieldSchema) {
        return { isValid: true };
      }

      const result = fieldSchema.safeParse(value);
      return {
        isValid: result.success,
        error: result.success ? undefined : result.error.errors[0]?.message,
      };
    } catch {
      return {
        isValid: false,
        error: 'Validation error occurred',
      };
    }
  };
}

// Form validation state helpers
export function getFormErrors(zodError: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
}

export function hasFormErrors(
  errors: Record<string, string | undefined>
): boolean {
  return Object.values(errors).some(
    (error) => error !== undefined && error !== ''
  );
}

export function getFirstFormError(
  errors: Record<string, string | undefined>
): string | undefined {
  return Object.values(errors).find(
    (error) => error !== undefined && error !== ''
  );
}

// Validation message helpers
export function formatValidationErrors(
  errors: Array<{ field: string; message: string }>
): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;

  return `Multiple validation errors: ${errors.map((err) => `${err.field}: ${err.message}`).join(', ')}`;
}

// Custom validation rules
export const customValidationRules = {
  // Check if a name is unique (would need to be called with async validation)
  uniqueName: (existingNames: string[]) =>
    z.string().refine((name) => !existingNames.includes(name.toLowerCase()), {
      message: 'This name is already taken',
    }),

  // Password strength validation
  strongPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),

  // URL validation
  validUrl: z.string().url('Please enter a valid URL'),

  // Phone number validation (basic)
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),

  // File size validation (for future file uploads)
  fileSize: (maxSizeInMB: number) =>
    z
      .number()
      .max(
        maxSizeInMB * 1024 * 1024,
        `File size must be less than ${maxSizeInMB}MB`
      ),
};
