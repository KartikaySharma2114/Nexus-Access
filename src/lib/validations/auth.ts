/**
 * Authentication and user validation schemas
 */

import { z } from 'zod';
import {
  idSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  validateData,
  type ValidationResult,
} from './common';

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name is too long'),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name is too long'),
    terms_accepted: z
      .boolean()
      .refine(
        (val) => val === true,
        'You must accept the terms and conditions'
      ),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_new_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: 'New passwords do not match',
    path: ['confirm_new_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  });

// Multi-factor authentication schemas
export const enableMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const verifyMfaSetupSchema = z.object({
  secret: z.string().min(1, 'MFA secret is required'),
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only digits'),
});

export const verifyMfaSchema = z.object({
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only digits'),
});

export const disableMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z
    .string()
    .length(6, 'MFA token must be 6 digits')
    .regex(/^\d{6}$/, 'MFA token must contain only digits'),
});

// User profile schemas
export const updateProfileSchema = z
  .object({
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name is too long')
      .optional(),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name is too long')
      .optional(),
    email: emailSchema.optional(),
    phone: phoneSchema,
    avatar_url: urlSchema.optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    timezone: z.string().optional(),
    language: z
      .enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'])
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

export const updateEmailSchema = z.object({
  new_email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Session management schemas
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const revokeSessionSchema = z.object({
  session_id: idSchema,
});

export const revokeAllSessionsSchema = z.object({
  except_current: z.boolean().optional().default(false),
});

// Account management schemas
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z
    .string()
    .refine(
      (val) => val === 'DELETE',
      'You must type "DELETE" to confirm account deletion'
    ),
});

export const exportUserDataSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  include_activity_logs: z.boolean().default(false),
  include_preferences: z.boolean().default(true),
});

// Admin user management schemas
export const createUserSchema = z.object({
  email: emailSchema,
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  password: passwordSchema.optional(),
  send_invitation: z.boolean().default(true),
  role_ids: z.array(idSchema).optional(),
});

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name is too long')
      .optional(),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name is too long')
      .optional(),
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    role_ids: z.array(idSchema).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

export const userQuerySchema = z.object({
  query: z.string().optional(),
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  role_id: idSchema.optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'updated_at', 'email', 'first_name', 'last_name'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Invitation schemas
export const sendInvitationSchema = z.object({
  email: emailSchema,
  role_ids: z.array(idSchema).optional(),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
  expires_in_days: z.number().int().min(1).max(30).default(7),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: passwordSchema,
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
});

export const resendInvitationSchema = z.object({
  invitation_id: idSchema,
});

// API key management schemas
export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  expires_at: z.string().datetime().optional(),
  permissions: z.array(nameSchema).optional(),
});

export const updateApiKeySchema = z
  .object({
    name: z
      .string()
      .min(1, 'API key name is required')
      .max(100, 'Name is too long')
      .optional(),
    description: z.string().max(500, 'Description is too long').optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

export const revokeApiKeySchema = z.object({
  api_key_id: idSchema,
});

// Validation helper functions
export const validateLoginData = (
  data: unknown
): ValidationResult<z.infer<typeof loginSchema>> => {
  return validateData(loginSchema, data);
};

export const validateRegisterData = (
  data: unknown
): ValidationResult<z.infer<typeof registerSchema>> => {
  return validateData(registerSchema, data);
};

export const validatePasswordChange = (
  data: unknown
): ValidationResult<z.infer<typeof changePasswordSchema>> => {
  return validateData(changePasswordSchema, data);
};

export const validateProfileUpdate = (
  data: unknown
): ValidationResult<z.infer<typeof updateProfileSchema>> => {
  return validateData(updateProfileSchema, data);
};

export const validateUserCreation = (
  data: unknown
): ValidationResult<z.infer<typeof createUserSchema>> => {
  return validateData(createUserSchema, data);
};

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type EnableMfaInput = z.infer<typeof enableMfaSchema>;
export type VerifyMfaSetupInput = z.infer<typeof verifyMfaSetupSchema>;
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;
export type DisableMfaInput = z.infer<typeof disableMfaSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
