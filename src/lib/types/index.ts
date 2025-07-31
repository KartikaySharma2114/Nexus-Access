// Re-export database types
export type { Database } from './database';

// Database Types
export interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at?: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at?: string;
}

// Extended Types for UI
export interface PermissionWithRoles extends Permission {
  roles: Role[];
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// Form Types
export interface CreatePermissionData {
  name: string;
  description?: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
}

export interface CreateRoleData {
  name: string;
}

export interface UpdateRoleData {
  name?: string;
}

// API Response Types
export interface APIError {
  error: string;
  message: string;
  details?: unknown;
  code: number;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
}
