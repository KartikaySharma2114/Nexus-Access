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

// Enhanced UI Types
export interface PermissionWithRoleCount extends Permission {
  roleCount: number;
}

export interface RoleWithPermissionCount extends Role {
  permissionCount: number;
}

export interface AssociationMatrix {
  roleId: string;
  permissionId: string;
  hasAssociation: boolean;
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

// Bulk operation types
export interface BulkAssignPermissionsData {
  roleId: string;
  permissionIds: string[];
}

export interface BulkRemovePermissionsData {
  roleId: string;
  permissionIds: string[];
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
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

export interface APISuccessResponse<T> {
  data: T;
  message?: string;
}

export interface APIErrorResponse {
  error: APIError;
}

// Loading and UI state types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T> extends LoadingState {
  data: T | null;
  isDirty: boolean;
}

// Natural language processing types (for future AI integration)
export interface AICommand {
  id: string;
  command: string;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
  result?: string;
  error?: string;
}

export interface AIContext {
  permissions: Permission[];
  roles: Role[];
  associations: RolePermission[];
}

// Audit and logging types
export interface AuditLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'unassign';
  resource_type: 'permission' | 'role' | 'association';
  resource_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  timestamp: string;
}

// Utility types
export type EntityType = 'permission' | 'role' | 'association' | 'user_role';

export type SortableFields<T> = {
  [K in keyof T]: T[K] extends string | number | Date ? K : never;
}[keyof T];

export type FilterableFields<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

// Generic CRUD operation types
export interface CRUDOperations<T, CreateData, UpdateData> {
  create: (data: CreateData) => Promise<T>;
  read: (id: string) => Promise<T | null>;
  update: (id: string, data: UpdateData) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (filters?: SearchFilters) => Promise<PaginatedResponse<T>>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface DataTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], item: T) => React.ReactNode;
  }>;
  onSort?: (field: keyof T, order: 'asc' | 'desc') => void;
  onFilter?: (filters: SearchFilters) => void;
  loading?: boolean;
}

// Form component prop types
export interface FormProps<T> extends BaseComponentProps {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  errors?: Record<string, string>;
}

// Modal component prop types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
