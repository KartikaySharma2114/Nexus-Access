/**
 * AI command validation schemas
 */

import { z } from 'zod';
import {
  idSchema,
  searchSchema,
  paginationSchema,
  sortSchema,
  validateData,
  type ValidationResult,
} from './common';

// AI command schemas
export const aiCommandSchema = z.object({
  command: z
    .string()
    .min(1, 'Command is required')
    .max(1000, 'Command is too long')
    .transform((val) => val.trim()),
  context: z
    .object({
      current_page: z.string().optional(),
      selected_items: z.array(idSchema).optional(),
      user_preferences: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const aiCommandHistorySchema = z.object({
  user_id: idSchema.optional(),
  command_type: z
    .enum([
      'create_permission',
      'create_role',
      'assign_permission',
      'assign_role',
      'search',
      'filter',
      'export',
      'import',
      'general',
    ])
    .optional(),
  success: z.boolean().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  ...paginationSchema.shape,
  ...sortSchema.shape,
  sortBy: z.enum(['timestamp', 'command_type', 'success']).optional(),
});

// AI response schemas
export const aiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
  suggestions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  execution_time: z.number().min(0).optional(),
});

// AI command processing schemas
export const processCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  user_id: idSchema,
  session_id: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

// AI training and feedback schemas
export const commandFeedbackSchema = z.object({
  command_id: idSchema,
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000, 'Feedback is too long').optional(),
  was_helpful: z.boolean(),
  suggested_improvement: z
    .string()
    .max(500, 'Suggestion is too long')
    .optional(),
});

export const reportIssueSchema = z.object({
  command_id: idSchema,
  issue_type: z.enum([
    'incorrect_interpretation',
    'failed_execution',
    'unexpected_result',
    'performance_issue',
    'security_concern',
    'other',
  ]),
  description: z
    .string()
    .min(10, 'Please provide a detailed description')
    .max(1000, 'Description is too long'),
  steps_to_reproduce: z
    .string()
    .max(1000, 'Steps description is too long')
    .optional(),
  expected_behavior: z
    .string()
    .max(500, 'Expected behavior description is too long')
    .optional(),
  actual_behavior: z
    .string()
    .max(500, 'Actual behavior description is too long')
    .optional(),
});

// AI model configuration schemas
export const aiModelConfigSchema = z.object({
  model_name: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().min(1).max(4000).default(1000),
  top_p: z.number().min(0).max(1).default(1),
  frequency_penalty: z.number().min(-2).max(2).default(0),
  presence_penalty: z.number().min(-2).max(2).default(0),
  stop_sequences: z.array(z.string()).optional(),
});

// AI command templates schemas
export const createCommandTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  template: z
    .string()
    .min(1, 'Template content is required')
    .max(2000, 'Template is too long'),
  category: z.enum([
    'permissions',
    'roles',
    'users',
    'associations',
    'search',
    'reporting',
    'administration',
    'general',
  ]),
  parameters: z
    .array(
      z.object({
        name: z.string().min(1, 'Parameter name is required'),
        type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
        required: z.boolean().default(false),
        description: z.string().optional(),
        default_value: z.unknown().optional(),
      })
    )
    .optional(),
  is_public: z.boolean().default(false),
});

export const updateCommandTemplateSchema = createCommandTemplateSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

export const commandTemplateQuerySchema = z.object({
  category: z
    .enum([
      'permissions',
      'roles',
      'users',
      'associations',
      'search',
      'reporting',
      'administration',
      'general',
    ])
    .optional(),
  is_public: z.boolean().optional(),
  created_by: idSchema.optional(),
  ...searchSchema.shape,
  ...sortSchema.shape,
  sortBy: z.enum(['name', 'category', 'created_at', 'usage_count']).optional(),
});

// AI analytics schemas
export const aiAnalyticsQuerySchema = z.object({
  metric: z.enum([
    'command_count',
    'success_rate',
    'response_time',
    'user_satisfaction',
    'popular_commands',
    'error_rate',
  ]),
  period: z.enum(['hour', 'day', 'week', 'month', 'year']).default('day'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  user_id: idSchema.optional(),
  command_type: z.string().optional(),
  group_by: z.enum(['user', 'command_type', 'time']).optional(),
});

// AI command validation and sanitization
export const sanitizeCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  remove_sensitive_data: z.boolean().default(true),
  validate_permissions: z.boolean().default(true),
});

// AI command execution schemas
export const executeCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  dry_run: z.boolean().default(false),
  confirm_destructive: z.boolean().default(false),
  timeout: z.number().int().min(1).max(300).default(30), // seconds
});

// AI learning and improvement schemas
export const commandLearningDataSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  intent: z.string().min(1, 'Intent is required'),
  entities: z
    .array(
      z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .optional(),
  expected_action: z.string().min(1, 'Expected action is required'),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Validation helper functions
export const validateAiCommand = (
  data: unknown
): ValidationResult<z.infer<typeof aiCommandSchema>> => {
  return validateData(aiCommandSchema, data);
};

export const validateCommandFeedback = (
  data: unknown
): ValidationResult<z.infer<typeof commandFeedbackSchema>> => {
  return validateData(commandFeedbackSchema, data);
};

export const validateCommandTemplate = (
  data: unknown
): ValidationResult<z.infer<typeof createCommandTemplateSchema>> => {
  return validateData(createCommandTemplateSchema, data);
};

export const validateCommandExecution = (
  data: unknown
): ValidationResult<z.infer<typeof executeCommandSchema>> => {
  return validateData(executeCommandSchema, data);
};

// Type exports
export type AiCommandInput = z.infer<typeof aiCommandSchema>;
export type AiCommandHistoryInput = z.infer<typeof aiCommandHistorySchema>;
export type AiResponseOutput = z.infer<typeof aiResponseSchema>;
export type ProcessCommandInput = z.infer<typeof processCommandSchema>;

export type CommandFeedbackInput = z.infer<typeof commandFeedbackSchema>;
export type ReportIssueInput = z.infer<typeof reportIssueSchema>;

export type AiModelConfigInput = z.infer<typeof aiModelConfigSchema>;

export type CreateCommandTemplateInput = z.infer<
  typeof createCommandTemplateSchema
>;
export type UpdateCommandTemplateInput = z.infer<
  typeof updateCommandTemplateSchema
>;
export type CommandTemplateQueryInput = z.infer<
  typeof commandTemplateQuerySchema
>;

export type AiAnalyticsQueryInput = z.infer<typeof aiAnalyticsQuerySchema>;
export type SanitizeCommandInput = z.infer<typeof sanitizeCommandSchema>;
export type ExecuteCommandInput = z.infer<typeof executeCommandSchema>;
export type CommandLearningDataInput = z.infer<
  typeof commandLearningDataSchema
>;
