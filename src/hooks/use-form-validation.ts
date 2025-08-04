/**
 * Real-time form validation hook
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { ErrorHandler } from '@/lib/error-utils';

export interface FormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  onValidationChange?: (
    isValid: boolean,
    errors: Record<string, string[]>
  ) => void;
}

export interface FormValidationState {
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  touchedFields: Set<string>;
  hasBeenSubmitted: boolean;
}

export interface FormValidationActions<T> {
  validateField: (field: keyof T, value: any) => Promise<boolean>;
  validateForm: (data: T) => Promise<boolean>;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  markFieldTouched: (field: keyof T) => void;
  markFormSubmitted: () => void;
  resetValidation: () => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFormErrors: (errors: Record<string, string[]>) => void;
}

export interface UseFormValidationReturn<T>
  extends FormValidationState,
    FormValidationActions<T> {
  getFieldError: (field: keyof T) => string | undefined;
  hasFieldError: (field: keyof T) => boolean;
  isFieldTouched: (field: keyof T) => boolean;
  shouldShowFieldError: (field: keyof T) => boolean;
}

/**
 * Custom hook for form validation with real-time feedback
 */
export function useFormValidation<T extends Record<string, any>>(
  options: FormValidationOptions<T>
): UseFormValidationReturn<T> {
  const {
    schema,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    onValidationChange,
  } = options;

  const [state, setState] = useState<FormValidationState>({
    errors: {},
    isValid: true,
    isValidating: false,
    touchedFields: new Set(),
    hasBeenSubmitted: false,
  });

  const errorHandler = useMemo(() => ErrorHandler.getInstance(), []);

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (field: keyof T, value: any) => {
      setState((prev) => ({ ...prev, isValidating: true }));

      try {
        // Create a partial schema for the specific field
        const fieldSchema = getFieldSchema(schema, field as string);
        if (!fieldSchema) {
          setState((prev) => ({ ...prev, isValidating: false }));
          return true;
        }

        const result = fieldSchema.safeParse(value);

        setState((prev) => {
          const newErrors = { ...prev.errors };
          const fieldKey = field as string;

          if (result.success) {
            delete newErrors[fieldKey];
          } else {
            newErrors[fieldKey] = result.error.issues.map(
              (issue) => issue.message
            );
          }

          const isValid = Object.keys(newErrors).length === 0;

          return {
            ...prev,
            errors: newErrors,
            isValid,
            isValidating: false,
          };
        });

        return result.success;
      } catch (error) {
        const structuredError = errorHandler.handleErrorSync(error, {
          component: 'useFormValidation',
          action: 'validateField',
          metadata: { field: field as string },
        });

        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field as string]: [structuredError.userMessage],
          },
          isValid: false,
          isValidating: false,
        }));

        return false;
      }
    }, debounceMs),
    [schema, debounceMs, errorHandler]
  );

  // Validate a specific field
  const validateField = useCallback(
    async (field: keyof T, value: any): Promise<boolean> => {
      if (!validateOnChange && !state.hasBeenSubmitted) {
        return true;
      }

      debouncedValidate(field, value);
      return true; // Return true for now, actual validation result will be in state
    },
    [debouncedValidate, validateOnChange, state.hasBeenSubmitted]
  );

  // Validate the entire form
  const validateForm = useCallback(
    async (data: T): Promise<boolean> => {
      setState((prev) => ({ ...prev, isValidating: true }));

      try {
        const result = schema.safeParse(data);

        const newErrors: Record<string, string[]> = {};

        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            const key = path || 'root';

            if (!newErrors[key]) {
              newErrors[key] = [];
            }
            newErrors[key].push(issue.message);
          });
        }

        const isValid = Object.keys(newErrors).length === 0;

        setState((prev) => ({
          ...prev,
          errors: newErrors,
          isValid,
          isValidating: false,
        }));

        if (onValidationChange) {
          onValidationChange(isValid, newErrors);
        }

        return isValid;
      } catch (error) {
        const structuredError = errorHandler.handleErrorSync(error, {
          component: 'useFormValidation',
          action: 'validateForm',
        });

        const errorObj = { form: [structuredError.userMessage] };

        setState((prev) => ({
          ...prev,
          errors: errorObj,
          isValid: false,
          isValidating: false,
        }));

        if (onValidationChange) {
          onValidationChange(false, errorObj);
        }

        return false;
      }
    },
    [schema, onValidationChange, errorHandler]
  );

  // Clear error for a specific field
  const clearFieldError = useCallback((field: keyof T) => {
    setState((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[field as string];
      const isValid = Object.keys(newErrors).length === 0;

      return {
        ...prev,
        errors: newErrors,
        isValid,
      };
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // Mark field as touched
  const markFieldTouched = useCallback((field: keyof T) => {
    setState((prev) => ({
      ...prev,
      touchedFields: new Set(prev.touchedFields).add(field as string),
    }));
  }, []);

  // Mark form as submitted
  const markFormSubmitted = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasBeenSubmitted: true,
    }));
  }, []);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
      hasBeenSubmitted: false,
    });
  }, []);

  // Set error for a specific field
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field as string]: [error],
      },
      isValid: false,
    }));
  }, []);

  // Set multiple form errors
  const setFormErrors = useCallback((errors: Record<string, string[]>) => {
    setState((prev) => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  // Get error for a specific field
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      const fieldErrors = state.errors[field as string];
      return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
    },
    [state.errors]
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (field: keyof T): boolean => {
      return Boolean(state.errors[field as string]?.length);
    },
    [state.errors]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (field: keyof T): boolean => {
      return state.touchedFields.has(field as string);
    },
    [state.touchedFields]
  );

  // Determine if field error should be shown
  const shouldShowFieldError = useCallback(
    (field: keyof T): boolean => {
      const hasError = hasFieldError(field);
      const isTouched = isFieldTouched(field);
      const hasBeenSubmitted = state.hasBeenSubmitted;

      return hasError && (isTouched || hasBeenSubmitted);
    },
    [hasFieldError, isFieldTouched, state.hasBeenSubmitted]
  );

  // Handle field blur events
  const handleFieldBlur = useCallback(
    (field: keyof T, value: any) => {
      markFieldTouched(field);

      if (validateOnBlur) {
        validateField(field, value);
      }
    },
    [markFieldTouched, validateOnBlur, validateField]
  );

  // Effect to notify about validation changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(state.isValid, state.errors);
    }
  }, [state.isValid, state.errors, onValidationChange]);

  return {
    // State
    ...state,

    // Actions
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    markFieldTouched,
    markFormSubmitted,
    resetValidation,
    setFieldError,
    setFormErrors,

    // Helpers
    getFieldError,
    hasFieldError,
    isFieldTouched,
    shouldShowFieldError,
  };
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Extract field schema from main schema
 */
function getFieldSchema(
  schema: z.ZodSchema,
  fieldName: string
): z.ZodSchema | null {
  try {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      return shape[fieldName] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook for simple field validation
 */
export function useFieldValidation<T>(
  schema: z.ZodSchema<T>,
  initialValue?: T
) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(
    async (newValue: T): Promise<boolean> => {
      setIsValidating(true);

      try {
        const result = schema.safeParse(newValue);

        if (result.success) {
          setError(undefined);
          setIsValidating(false);
          return true;
        } else {
          setError(result.error.issues[0]?.message || 'Validation failed');
          setIsValidating(false);
          return false;
        }
      } catch (err) {
        setError('Validation error occurred');
        setIsValidating(false);
        return false;
      }
    },
    [schema]
  );

  const updateValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await validate(newValue);
    },
    [validate]
  );

  return {
    value,
    error,
    isValidating,
    isValid: !error,
    setValue: updateValue,
    validate,
    clearError: () => setError(undefined),
  };
}
