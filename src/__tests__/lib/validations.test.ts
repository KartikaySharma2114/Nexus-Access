import {
  createPermissionSchema,
  createRoleSchema,
  createAssociationSchema,
  searchSchema,
  idSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('createPermissionSchema', () => {
    it('should validate valid permission data', () => {
      const validData = {
        name: 'read_users',
        description: 'Read user data',
      };

      const result = createPermissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Test',
      };

      const result = createPermissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid characters in name', () => {
      const invalidData = {
        name: 'read users!',
        description: 'Test',
      };

      const result = createPermissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null description', () => {
      const validData = {
        name: 'read_users',
        description: null,
      };

      const result = createPermissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject too long name', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        description: 'Test',
      };

      const result = createPermissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createRoleSchema', () => {
    it('should validate valid role data', () => {
      const validData = {
        name: 'admin',
      };

      const result = createRoleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };

      const result = createRoleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid characters in name', () => {
      const invalidData = {
        name: 'admin role!',
      };

      const result = createRoleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createAssociationSchema', () => {
    it('should validate valid association data', () => {
      const validData = {
        role_id: '123e4567-e89b-12d3-a456-426614174000',
        permission_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = createAssociationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid UUIDs', () => {
      const invalidData = {
        role_id: 'invalid-uuid',
        permission_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = createAssociationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('searchSchema', () => {
    it('should validate search parameters', () => {
      const validData = {
        query: 'test',
        limit: 25,
        offset: 0,
      };

      const result = searchSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should use defaults for missing values', () => {
      const result = searchSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject invalid limit', () => {
      const invalidData = {
        limit: 101, // Too high
      };

      const result = searchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const invalidData = {
        offset: -1,
      };

      const result = searchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('idSchema', () => {
    it('should validate valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      const result = idSchema.safeParse(validId);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidId = 'not-a-uuid';
      const result = idSchema.safeParse(invalidId);
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = idSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});
