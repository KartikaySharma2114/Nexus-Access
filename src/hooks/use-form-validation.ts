'use client';

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface ValidationResult<T> {
  data: T | null;
  errors: Record<string, string>;
  isValid: boolean;
  hasErrors: boolean;
}

interface UseFormValidationReturn<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isValidating: boolean;
  hasErrors: boolean;
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<ValidationResult<T>>;
  reset: (values?: Partial<T>) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {},
  options: ValidationOptions = {}
): UseFormValidationReturn<T> {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  const [values, setValuesState] = useState<Partial<T>>(initialValues);
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  const [validationTimeout, setValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      try {
        const fieldSchema = schema.shape[field as string];
        if (!fieldSchema) return true;

        const result = await fieldSchema.parseAsync(values[field]);

        // Clear error if validation passes
        setErrorsState((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });

        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors[0]?.message || 'Invalid value';
          setErrorsState((prev) => ({
            ...prev,
            [field as string]: fieldError,
          }));
        }
        return false;
      }
    },
    [schema, values]
  );

  const validateForm = useCallback(async (): Promise<ValidationResult<T>> => {
    setIsValidating(true);

    try {
      const result = await schema.parseAsync(values);

      // Clear all errors if validation passes
      setErrorsState({});

      return {
        data: result,
        errors: {},
        isValid: true,
        hasErrors: false,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });

        setErrorsState(newErrors);

        return {
          data: null,
          errors: newErrors,
          isValid: false,
          hasErrors: true,
        };
      }

      // Handle unexpected errors
      const genericError = { form: 'Validation failed' };
      setErrorsState(genericError);

      return {
        data: null,
        errors: genericError,
        isValid: false,
        hasErrors: true,
      };
    } finally {
      setIsValidating(false);
    }
  }, [schema, values]);

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValuesState((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Validate on change if enabled
      if (validateOnChange && touched[field as string]) {
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }

        const timeout = setTimeout(() => {
          validateField(field);
        }, debounceMs);

        setValidationTimeout(timeout);
      }
    },
    [validateOnChange, touched, validateField, debounceMs, validationTimeout]
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState((prev) => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const setTouched = useCallback(
    (field: keyof T, isTouched: boolean = true) => {
      setTouchedState((prev) => ({
        ...prev,
        [field as string]: isTouched,
      }));
    },
    []
  );

  const reset = useCallback(
    (newValues?: Partial<T>) => {
      setValuesState(newValues || initialValues);
      setErrorsState({});
      setTouchedState({});
    },
    [initialValues]
  );

  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(field, true);

      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField, setTouched]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const isValid = Object.keys(errors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    hasErrors,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    validateField,
    validateForm,
    reset,
    handleChange,
    handleBlur,
  };
}
