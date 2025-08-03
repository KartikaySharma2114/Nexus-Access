/**
 * Main validation exports - Re-exports from organized validation modules
 * @deprecated Use specific validation modules instead (common, rbac, auth, ai)
 */

import { z } from 'zod';

// Re-export common schemas for backward compatibility
export {
  idSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  descriptionSchema,
  searchSchema,
  paginationSchema,
  validateData,
  type ValidationResult,
} from './validations/common';

// Re-export RBAC schemas for backward compatibility
export {
  createPermissionSchema,
  updatePermissionSchema,
  createRoleSchema,
  updateRoleSchema,
  createAssociationSchema,
  deleteAssociationSchema,
  batchCreateAssociationsSchema as batchAssociationSchema,
  validatePermissionData,
  validateRoleData,
  validateAssociationData,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type CreateRoleInput,
  type UpdateRoleInput,
  type CreateAssociationInput,
} from './validations/rbac';

// Re-export auth schemas for backward compatibility
export {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  validateLoginData,
  validateRegisterData,
  type LoginInput,
  type RegisterInput,
} from './validations/auth';

// Re-export AI schemas for backward compatibility
export {
  aiCommandSchema,
  validateAiCommand,
  type AiCommandInput,
} from './validations/ai';

// Re-export validation middleware
export {
  createValidationMiddleware,
  validateBody,
  validateQuery,
  validateParams,
  validate,
  withValidation,
  getValidatedData,
  getValidatedBody,
  getValidatedQuery,
  getValidatedParams,
  type ValidationOptions,
  type ValidatedRequest,
} from './validations/middleware';
