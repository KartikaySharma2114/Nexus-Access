import type {
  Permission,
  Role,
  RolePermission,
  UserRole,
  PermissionWithRoles,
  RoleWithPermissions,
  PermissionWithRoleCount,
  RoleWithPermissionCount,
  AssociationMatrix,
  PaginatedResponse,
  SearchFilters,
} from './types';

/**
 * RBAC-specific utility functions for data transformation and business logic
 */

// Transform permissions with their associated roles
export function enrichPermissionsWithRoles(
  permissions: Permission[],
  roles: Role[],
  associations: RolePermission[]
): PermissionWithRoles[] {
  return permissions.map((permission) => {
    const associatedRoleIds = associations
      .filter((assoc) => assoc.permission_id === permission.id)
      .map((assoc) => assoc.role_id);

    const associatedRoles = roles.filter((role) =>
      associatedRoleIds.includes(role.id)
    );

    return {
      ...permission,
      roles: associatedRoles,
    };
  });
}

// Transform roles with their associated permissions
export function enrichRolesWithPermissions(
  roles: Role[],
  permissions: Permission[],
  associations: RolePermission[]
): RoleWithPermissions[] {
  return roles.map((role) => {
    const associatedPermissionIds = associations
      .filter((assoc) => assoc.role_id === role.id)
      .map((assoc) => assoc.permission_id);

    const associatedPermissions = permissions.filter((permission) =>
      associatedPermissionIds.includes(permission.id)
    );

    return {
      ...role,
      permissions: associatedPermissions,
    };
  });
}

// Transform permissions with role count for summary views
export function enrichPermissionsWithRoleCount(
  permissions: Permission[],
  associations: RolePermission[]
): PermissionWithRoleCount[] {
  return permissions.map((permission) => {
    const roleCount = associations.filter(
      (assoc) => assoc.permission_id === permission.id
    ).length;

    return {
      ...permission,
      roleCount,
    };
  });
}

// Transform roles with permission count for summary views
export function enrichRolesWithPermissionCount(
  roles: Role[],
  associations: RolePermission[]
): RoleWithPermissionCount[] {
  return roles.map((role) => {
    const permissionCount = associations.filter(
      (assoc) => assoc.role_id === role.id
    ).length;

    return {
      ...role,
      permissionCount,
    };
  });
}

// Create association matrix for UI grid display
export function createAssociationMatrix(
  roles: Role[],
  permissions: Permission[],
  associations: RolePermission[]
): AssociationMatrix[] {
  const matrix: AssociationMatrix[] = [];

  roles.forEach((role) => {
    permissions.forEach((permission) => {
      const hasAssociation = associations.some(
        (assoc) =>
          assoc.role_id === role.id && assoc.permission_id === permission.id
      );

      matrix.push({
        roleId: role.id,
        permissionId: permission.id,
        hasAssociation,
      });
    });
  });

  return matrix;
}

// Get all permissions that a user has through their roles
export function getUserPermissions(
  userId: string,
  userRoles: UserRole[],
  rolePermissions: RolePermission[],
  permissions: Permission[]
): Permission[] {
  // Get user's role IDs
  const userRoleIds = userRoles
    .filter((ur) => ur.user_id === userId)
    .map((ur) => ur.role_id);

  // Get permission IDs for user's roles
  const permissionIds = rolePermissions
    .filter((rp) => userRoleIds.includes(rp.role_id))
    .map((rp) => rp.permission_id);

  // Remove duplicates and get permission objects
  const uniquePermissionIds = [...new Set(permissionIds)];
  return permissions.filter((p) => uniquePermissionIds.includes(p.id));
}

// Check if a user has a specific permission
export function userHasPermission(
  userId: string,
  permissionName: string,
  userRoles: UserRole[],
  rolePermissions: RolePermission[],
  permissions: Permission[]
): boolean {
  const userPermissions = getUserPermissions(
    userId,
    userRoles,
    rolePermissions,
    permissions
  );
  return userPermissions.some((p) => p.name === permissionName);
}

// Get all users who have a specific permission
export function getUsersWithPermission(
  permissionId: string,
  userRoles: UserRole[],
  rolePermissions: RolePermission[]
): string[] {
  // Get roles that have this permission
  const rolesWithPermission = rolePermissions
    .filter((rp) => rp.permission_id === permissionId)
    .map((rp) => rp.role_id);

  // Get users who have these roles
  const usersWithPermission = userRoles
    .filter((ur) => rolesWithPermission.includes(ur.role_id))
    .map((ur) => ur.user_id);

  // Remove duplicates
  return [...new Set(usersWithPermission)];
}

// Validate role-permission assignment (business rules)
export function validateRolePermissionAssignment(
  roleId: string,
  permissionId: string,
  roles: Role[],
  permissions: Permission[],
  existingAssociations: RolePermission[]
): { isValid: boolean; error?: string } {
  // Check if role exists
  const role = roles.find((r) => r.id === roleId);
  if (!role) {
    return { isValid: false, error: 'Role not found' };
  }

  // Check if permission exists
  const permission = permissions.find((p) => p.id === permissionId);
  if (!permission) {
    return { isValid: false, error: 'Permission not found' };
  }

  // Check if association already exists
  const associationExists = existingAssociations.some(
    (assoc) => assoc.role_id === roleId && assoc.permission_id === permissionId
  );
  if (associationExists) {
    return { isValid: false, error: 'Association already exists' };
  }

  return { isValid: true };
}

// Find orphaned permissions (permissions not assigned to any role)
export function findOrphanedPermissions(
  permissions: Permission[],
  associations: RolePermission[]
): Permission[] {
  const assignedPermissionIds = new Set(
    associations.map((assoc) => assoc.permission_id)
  );
  return permissions.filter(
    (permission) => !assignedPermissionIds.has(permission.id)
  );
}

// Find orphaned roles (roles with no permissions)
export function findOrphanedRoles(
  roles: Role[],
  associations: RolePermission[]
): Role[] {
  const rolesWithPermissions = new Set(
    associations.map((assoc) => assoc.role_id)
  );
  return roles.filter((role) => !rolesWithPermissions.has(role.id));
}

// Apply search and filter logic
export function applySearchFilters<
  T extends { name: string; created_at: string },
>(items: T[], filters: SearchFilters): T[] {
  let filteredItems = [...items];

  // Apply search query
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  if (filters.sortBy) {
    filteredItems.sort((a, b) => {
      let aValue: unknown = a[filters.sortBy!];
      let bValue: unknown = b[filters.sortBy!];

      // Handle date sorting
      if (filters.sortBy === 'created_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aStr = aValue.toLowerCase();
        const bStr = bValue.toLowerCase();

        if (filters.sortOrder === 'desc') {
          return bStr > aStr ? 1 : bStr < aStr ? -1 : 0;
        } else {
          return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
        }
      }

      // Handle numeric sorting (for dates converted to timestamps)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (filters.sortOrder === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      }

      // Fallback for other types
      return 0;
    });
  }

  return filteredItems;
}

// Create paginated response
export function createPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 50
): PaginatedResponse<T> {
  const offset = (page - 1) * pageSize;
  const paginatedItems = items.slice(offset, offset + pageSize);
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: paginatedItems,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// Generate suggestions for role-permission assignments
export function generateAssignmentSuggestions(
  roles: Role[],
  permissions: Permission[],
  associations: RolePermission[]
): Array<{ roleId: string; permissionId: string; reason: string }> {
  const suggestions: Array<{
    roleId: string;
    permissionId: string;
    reason: string;
  }> = [];

  // Find roles with similar names and suggest similar permissions
  roles.forEach((role) => {
    const roleName = role.name.toLowerCase();

    permissions.forEach((permission) => {
      const permissionName = permission.name.toLowerCase();
      const hasAssociation = associations.some(
        (assoc) =>
          assoc.role_id === role.id && assoc.permission_id === permission.id
      );

      if (!hasAssociation) {
        // Suggest based on name similarity
        if (roleName.includes('admin') && permissionName.includes('manage')) {
          suggestions.push({
            roleId: role.id,
            permissionId: permission.id,
            reason: 'Admin roles typically have management permissions',
          });
        }

        if (roleName.includes('user') && permissionName.includes('read')) {
          suggestions.push({
            roleId: role.id,
            permissionId: permission.id,
            reason: 'User roles typically have read permissions',
          });
        }

        if (roleName.includes('editor') && permissionName.includes('edit')) {
          suggestions.push({
            roleId: role.id,
            permissionId: permission.id,
            reason: 'Editor roles typically have edit permissions',
          });
        }
      }
    });
  });

  return suggestions;
}

// Calculate RBAC statistics
export function calculateRBACStats(
  permissions: Permission[],
  roles: Role[],
  associations: RolePermission[],
  userRoles: UserRole[]
) {
  const orphanedPermissions = findOrphanedPermissions(
    permissions,
    associations
  );
  const orphanedRoles = findOrphanedRoles(roles, associations);

  const avgPermissionsPerRole =
    roles.length > 0 ? associations.length / roles.length : 0;

  const avgRolesPerUser =
    userRoles.length > 0
      ? userRoles.length / new Set(userRoles.map((ur) => ur.user_id)).size
      : 0;

  return {
    totalPermissions: permissions.length,
    totalRoles: roles.length,
    totalAssociations: associations.length,
    totalUserRoles: userRoles.length,
    orphanedPermissions: orphanedPermissions.length,
    orphanedRoles: orphanedRoles.length,
    avgPermissionsPerRole: Math.round(avgPermissionsPerRole * 100) / 100,
    avgRolesPerUser: Math.round(avgRolesPerUser * 100) / 100,
    uniqueUsers: new Set(userRoles.map((ur) => ur.user_id)).size,
  };
}
