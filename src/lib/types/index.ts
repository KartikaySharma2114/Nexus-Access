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
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

// Extended Types for UI
export interface PermissionWithRoles extends Permission {
  roles: Role[];
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
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
