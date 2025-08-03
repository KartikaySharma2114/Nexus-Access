/**
 * Common validation schemas and utilities
 */

import { z } from 'zod';

// Base primitive schemas
export const idSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email address is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]+$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const nameSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Name can only contain letters, numbers, underscores, and hyphens'
      )
  );

export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional()
  .nullable()
  .transform((val) => val?.trim() || null);

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long');

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format'
  )
  .optional();

// Pagination schemas
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .default(0),
});

export const searchSchema = z.object({
  query: z
    .string()
    .max(255, 'Search query is too long')
    .optional()
    .default('')
    .transform((val) => val.trim()),
  ...paginationSchema.shape,
});

// Sort schemas
export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc');

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: sortOrderSchema,
});

// Date schemas
export const dateSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.date())
  .transform((val) => new Date(val));

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
);

// File upload schemas
export const fileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
  type: z.string().min(1, 'File type is required'),
});

export const imageFileSchema = fileSchema.extend({
  type: z.string().regex(
    /^image\/(jpeg|jpg|png|gif|webp)$/,
    'File must be a valid image format (JPEG, PNG, GIF, or WebP)'
  ),
  size: z.number().max(5 * 1024 * 1024, 'Image file size cannot exceed 5MB'),
});

// Array schemas
export const nonEmptyArraySchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).min(1, 'At least one item is required');

export const uniqueArraySchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).refine(
    (items) => new Set(items).size === items.length,
    'Array items must be unique'
  );

// Conditional schemas
export const conditionalSchema = <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
  condition: (data: any) => boolean,
  trueSchema: T,
  falseSchema: U
) =>
  z.union([trueSchema, falseSchema]).superRefine((data, ctx) => {
    if (condition(data)) {
      const result = trueSchema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: issue.code,
            path: issue.path,
            message: issue.message,
          } as any);
        });
      }
    } else {
      const result = falseSchema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: issue.code,
            path: issue.path,
            message: issue.message,
          } as any);
        });
      }
    }
  });

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Custom validation helpers
export const createEnumSchema = <T extends readonly [string, ...string[]]>(
  values: T,
  message?: string
) =>
  z.enum(values, {
    message: message || `Value must be one of: ${values.join(', ')}`,
  });

export const createRegexSchema = (
  pattern: RegExp,
  message: string
) =>
  z.string().regex(pattern, message);

// Validation result types
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: Record<string, string[]>;
};

// Validation utility functions
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: Record<string, string[]> = {};
  
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return {
    success: false,
    errors,
  };
};

export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error?: string } => {
  const result = schema.safeParse(value);
  
  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || 'Validation failed',
  };
};

// Schema composition helpers
export const extendSchema = <T extends z.ZodRawShape, U extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  extension: U
) => baseSchema.extend(extension);

export const pickSchema = <T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
) => {
  const pickObject = {} as any;
  keys.forEach(key => {
    pickObject[key] = true;
  });
  return schema.pick(pickObject);
};

export const omitSchema = <T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
) => {
  const omitObject = {} as any;
  keys.forEach(key => {
    omitObject[key] = true;
  });
  return schema.omit(omitObject);
};

export const partialSchema = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) => schema.partial();

export const requiredSchema = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) => schema.required();