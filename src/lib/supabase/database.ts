import { createClient as createServerClient } from './server';
import { createClient as createBrowserClient } from './client';
import { handleDatabaseError } from './errors';
import type { Permission, Role, RolePermission, UserRole, PermissionWithRoles, RoleWithPermissions } from '../types';

// Helper function to get the appropriate client
export function getSupabaseClient(isServer = false) {
  if (isServer) {
    return createServerClient();
  }
  return createBrowserClient();
}

// Permission operations
export async function getPermissions(isServer = false): Promise<Permission[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('name');

  if (error) {
    throw handleDatabaseError(error);
  }

  return data || [];
}

export async function getPermissionById(id: string, isServer = false): Promise<Permission | null> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw handleDatabaseError(error);
  }

  return data;
}

export async function createPermission(permission: { name: string; description?: string }, isServer = false): Promise<Permission> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .insert(permission)
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function updatePermission(id: string, updates: { name?: string; description?: string }, isServer = false): Promise<Permission> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function deletePermission(id: string, isServer = false): Promise<void> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { error } = await supabase
    .from('permissions')
    .delete()
    .eq('id', id);

  if (error) {
    throw handleDatabaseError(error);
  }
}

// Role operations
export async function getRoles(isServer = false): Promise<Role[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) {
    throw handleDatabaseError(error);
  }

  return data || [];
}

export async function getRoleById(id: string, isServer = false): Promise<Role | null> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw handleDatabaseError(error);
  }

  return data;
}

export async function createRole(role: { name: string }, isServer = false): Promise<Role> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function updateRole(id: string, updates: { name?: string }, isServer = false): Promise<Role> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function deleteRole(id: string, isServer = false): Promise<void> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) {
    throw handleDatabaseError(error);
  }
}

// Role-Permission association operations
export async function getRolePermissions(isServer = false): Promise<RolePermission[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*');

  if (error) {
    throw handleDatabaseError(error);
  }

  return data || [];
}

export async function assignPermissionToRole(roleId: string, permissionId: string, isServer = false): Promise<RolePermission> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('role_permissions')
    .insert({ role_id: roleId, permission_id: permissionId })
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function removePermissionFromRole(roleId: string, permissionId: string, isServer = false): Promise<void> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)
    .eq('permission_id', permissionId);

  if (error) {
    throw handleDatabaseError(error);
  }
}

// Complex queries for UI
export async function getPermissionsWithRoles(isServer = false): Promise<PermissionWithRoles[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .select(`
      *,
      role_permissions!inner(
        roles(*)
      )
    `)
    .order('name');

  if (error) {
    throw handleDatabaseError(error);
  }

  // Transform the data to match our interface
  return (data || []).map(permission => ({
    ...permission,
    roles: permission.role_permissions?.map((rp: any) => rp.roles).filter(Boolean) || []
  }));
}

export async function getRolesWithPermissions(isServer = false): Promise<RoleWithPermissions[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      role_permissions!inner(
        permissions(*)
      )
    `)
    .order('name');

  if (error) {
    throw handleDatabaseError(error);
  }

  // Transform the data to match our interface
  return (data || []).map(role => ({
    ...role,
    permissions: role.role_permissions?.map((rp: any) => rp.permissions).filter(Boolean) || []
  }));
}

// User role operations
export async function getUserRoles(userId: string, isServer = false): Promise<UserRole[]> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw handleDatabaseError(error);
  }

  return data || [];
}

export async function assignRoleToUser(userId: string, roleId: string, isServer = false): Promise<UserRole> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId })
    .select()
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function removeRoleFromUser(userId: string, roleId: string, isServer = false): Promise<void> {
  const supabase = isServer ? await createServerClient() : createBrowserClient();
  
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) {
    throw handleDatabaseError(error);
  }
}