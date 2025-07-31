import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  Permission,
  Role,
  RolePermission,
  UserRole,
  PermissionWithRoles,
  RoleWithPermissions,
} from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Data transformation utilities
export function transformPermissionWithRoles(
  permission: Permission,
  roles: Role[]
): PermissionWithRoles {
  return {
    ...permission,
    roles,
  };
}

export function transformRoleWithPermissions(
  role: Role,
  permissions: Permission[]
): RoleWithPermissions {
  return {
    ...role,
    permissions,
  };
}

// Utility to extract role IDs from role-permission associations
export function extractRoleIds(associations: RolePermission[]): string[] {
  return [...new Set(associations.map((assoc) => assoc.role_id))];
}

// Utility to extract permission IDs from role-permission associations
export function extractPermissionIds(associations: RolePermission[]): string[] {
  return [...new Set(associations.map((assoc) => assoc.permission_id))];
}

// Utility to group associations by role ID
export function groupAssociationsByRole(
  associations: RolePermission[]
): Record<string, string[]> {
  return associations.reduce(
    (acc, assoc) => {
      if (!acc[assoc.role_id]) {
        acc[assoc.role_id] = [];
      }
      acc[assoc.role_id].push(assoc.permission_id);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

// Utility to group associations by permission ID
export function groupAssociationsByPermission(
  associations: RolePermission[]
): Record<string, string[]> {
  return associations.reduce(
    (acc, assoc) => {
      if (!acc[assoc.permission_id]) {
        acc[assoc.permission_id] = [];
      }
      acc[assoc.permission_id].push(assoc.role_id);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

// Utility to check if a role has a specific permission
export function roleHasPermission(
  roleId: string,
  permissionId: string,
  associations: RolePermission[]
): boolean {
  return associations.some(
    (assoc) => assoc.role_id === roleId && assoc.permission_id === permissionId
  );
}

// Utility to get all permissions for a specific role
export function getPermissionsForRole(
  roleId: string,
  associations: RolePermission[]
): string[] {
  return associations
    .filter((assoc) => assoc.role_id === roleId)
    .map((assoc) => assoc.permission_id);
}

// Utility to get all roles that have a specific permission
export function getRolesWithPermission(
  permissionId: string,
  associations: RolePermission[]
): string[] {
  return associations
    .filter((assoc) => assoc.permission_id === permissionId)
    .map((assoc) => assoc.role_id);
}

// Utility to create role-permission association objects
export function createAssociation(
  roleId: string,
  permissionId: string
): RolePermission {
  return {
    role_id: roleId,
    permission_id: permissionId,
  };
}

// Utility to create user-role association objects
export function createUserRoleAssociation(
  userId: string,
  roleId: string
): UserRole {
  return {
    user_id: userId,
    role_id: roleId,
  };
}

// Utility to validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Utility to sanitize string input
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

// Utility to format date strings for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Utility to sort items by name
export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

// Utility to sort items by creation date
export function sortByCreatedAt<T extends { created_at: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Utility to filter items by search term
export function filterBySearchTerm<T extends { name: string }>(
  items: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return items;

  const term = searchTerm.toLowerCase().trim();
  return items.filter((item) => item.name.toLowerCase().includes(term));
}

// Utility to debounce function calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
