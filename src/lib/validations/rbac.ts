/**
 * RBAC-specific validation schemas
 */

import { z } from 'zod';
import {
  idSchema,
  nameSchema,
  descriptionSchema,
  searchSchema,
  paginationSchema,
  sortSchema,
  nonEmptyArraySchema,
  uniqueArraySchema,
  validateData,
  type ValidationResult,
} from './common';

// Permission validation schemas
export const createPermissionSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updatePermissionSchema = createPermissionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export const permissionQuerySchema = searchSchema.extend({
  ...sortSchema.shape,
  sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
});

// Role validation schemas
export const createRoleSchema = z.object({
  name: nameSchema,
});

export const updateRoleSchema = createRoleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export const roleQuerySchema = searchSchema.extend({
  ...sortSchema.shape,
  sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
});

// Association validation schemas
export const createAssociationSchema = z.object({
  role_id: idSchema,
  permission_id: idSchema,
});

export const deleteAssociationSchema = createAssociationSchema;

export const batchCreateAssociationsSchema = z.object({
  role_id: idSchema,
  permission_ids: uniqueArraySchema(idSchema),
});

export const batchDeleteAssociationsSchema = batchCreateAssociationsSchema;

export const associationQuerySchema = z.object({
  role_id: idSchema.optional(),
  permission_id: idSchema.optional(),
  ...paginationSchema.shape,
}).refine(
  (data) => data.role_id || data.permission_id,
  'Either role_id or permission_id must be provided'
);

// User role validation schemas
export const assignUserRoleSchema = z.object({
  user_id: idSchema,
  role_id: idSchema,
});

export const unassignUserRoleSchema = assignUserRoleSchema;

export const batchAssignUserRolesSchema = z.object({
  user_id: idSchema,
  role_ids: uniqueArraySchema(idSchema),
});

export const batchUnassignUserRolesSchema = batchAssignUserRolesSchema;

export const userRoleQuerySchema = z.object({
  user_id: idSchema.optional(),
  role_id: idSchema.optional(),
  ...paginationSchema.shape,
}).refine(
  (data) => data.user_id || data.role_id,
  'Either user_id or role_id must be provided'
);

// Permission check schemas
export const checkPermissionSchema = z.object({
  user_id: idSchema,
  permission_name: nameSchema,
  resource_id: idSchema.optional(),
});

export const checkMultiplePermissionsSchema = z.object({
  user_id: idSchema,
  permissions: nonEmptyArraySchema(z.object({
    permission_name: nameSchema,
    resource_id: idSchema.optional(),
  })),
});

// Bulk operations schemas
export const bulkCreatePermissionsSchema = z.object({
  permissions: nonEmptyArraySchema(createPermissionSchema),
});

export const bulkUpdatePermissionsSchema = z.object({
  updates: nonEmptyArraySchema(z.object({
    id: idSchema,
    ...updatePermissionSchema.shape,
  })),
});

export const bulkDeletePermissionsSchema = z.object({
  ids: uniqueArraySchema(idSchema),
});

export const bulkCreateRolesSchema = z.object({
  roles: nonEmptyArraySchema(createRoleSchema),
});

export const bulkUpdateRolesSchema = z.object({
  updates: nonEmptyArraySchema(z.object({
    id: idSchema,
    ...updateRoleSchema.shape,
  })),
});

export const bulkDeleteRolesSchema = z.object({
  ids: uniqueArraySchema(idSchema),
});

// Import/Export schemas
export const exportRbacSchema = z.object({
  include_permissions: z.boolean().default(true),
  include_roles: z.boolean().default(true),
  include_associations: z.boolean().default(true),
  include_user_roles: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
});

export const importRbacSchema = z.object({
  data: z.object({
    permissions: z.array(createPermissionSchema).optional(),
    roles: z.array(createRoleSchema).optional(),
    associations: z.array(createAssociationSchema).optional(),
  }),
  options: z.object({
    overwrite_existing: z.boolean().default(false),
    skip_duplicates: z.boolean().default(true),
    validate_references: z.boolean().default(true),
  }).optional(),
});

// Audit and logging schemas
export const auditLogQuerySchema = z.object({
  user_id: idSchema.optional(),
  action: z.enum([
    'create_permission',
    'update_permission',
    'delete_permission',
    'create_role',
    'update_role',
    'delete_role',
    'create_association',
    'delete_association',
    'assign_user_role',
    'unassign_user_role',
  ]).optional(),
  resource_type: z.enum(['permission', 'role', 'association', 'user_role']).optional(),
  resource_id: idSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  ...paginationSchema.shape,
  ...sortSchema.shape,
  sortBy: z.enum(['timestamp', 'action', 'user_id']).optional(),
});

// Validation helper functions
export const validatePermissionData = (data: unknown): ValidationResult<z.infer<typeof createPermissionSchema>> => {
  return validateData(createPermissionSchema, data);
};

export const validateRoleData = (data: unknown): ValidationResult<z.infer<typeof createRoleSchema>> => {
  return validateData(createRoleSchema, data);
};

export const validateAssociationData = (data: unknown): ValidationResult<z.infer<typeof createAssociationSchema>> => {
  return validateData(createAssociationSchema, data);
};

export const validatePermissionUpdate = (data: unknown): ValidationResult<z.infer<typeof updatePermissionSchema>> => {
  return validateData(updatePermissionSchema, data);
};

export const validateRoleUpdate = (data: unknown): ValidationResult<z.infer<typeof updateRoleSchema>> => {
  return validateData(updateRoleSchema, data);
};

// Type exports
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type PermissionQueryInput = z.infer<typeof permissionQuerySchema>;

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleQueryInput = z.infer<typeof roleQuerySchema>;

export type CreateAssociationInput = z.infer<typeof createAssociationSchema>;
export type BatchCreateAssociationsInput = z.infer<typeof batchCreateAssociationsSchema>;
export type AssociationQueryInput = z.infer<typeof associationQuerySchema>;

export type AssignUserRoleInput = z.infer<typeof assignUserRoleSchema>;
export type BatchAssignUserRolesInput = z.infer<typeof batchAssignUserRolesSchema>;
export type UserRoleQueryInput = z.infer<typeof userRoleQuerySchema>;

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
export type CheckMultiplePermissionsInput = z.infer<typeof checkMultiplePermissionsSchema>;

export type ExportRbacInput = z.infer<typeof exportRbacSchema>;
export type ImportRbacInput = z.infer<typeof importRbacSchema>;

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;