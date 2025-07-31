import { createClient } from '@/lib/supabase/server';
import { RBACContext } from './types';

/**
 * Context manager for providing current RBAC state to AI commands
 */
export class RBACContextManager {
  private static instance: RBACContextManager;
  private context: RBACContext | null = null;
  private lastUpdated: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): RBACContextManager {
    if (!RBACContextManager.instance) {
      RBACContextManager.instance = new RBACContextManager();
    }
    return RBACContextManager.instance;
  }

  /**
   * Get current RBAC context with caching
   */
  public async getContext(): Promise<RBACContext> {
    const now = Date.now();

    // Return cached context if still valid
    if (this.context && now - this.lastUpdated < this.CACHE_DURATION) {
      return this.context;
    }

    // Fetch fresh context
    await this.refreshContext();
    return this.context!;
  }

  /**
   * Force refresh of the context
   */
  public async refreshContext(): Promise<void> {
    try {
      const supabase = await createClient();

      // Fetch all permissions
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('id, name, description')
        .order('name');

      if (permError) throw permError;

      // Fetch all roles
      const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (roleError) throw roleError;

      // Fetch all associations
      const { data: associations, error: assocError } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');

      if (assocError) throw assocError;

      this.context = {
        permissions: (permissions || []).map((p) => ({
          ...p,
          description: p.description || undefined,
        })),
        roles: roles || [],
        associations: associations || [],
      };

      this.lastUpdated = Date.now();
    } catch (error) {
      console.error('Failed to refresh RBAC context:', error);
      // Keep existing context if refresh fails
      if (!this.context) {
        this.context = {
          permissions: [],
          roles: [],
          associations: [],
        };
      }
    }
  }

  /**
   * Get context as formatted string for AI prompt
   */
  public async getContextString(): Promise<string> {
    const context = await this.getContext();

    const permissionsList = context.permissions
      .map((p) => `- ${p.name}${p.description ? ` (${p.description})` : ''}`)
      .join('\n');

    const rolesList = context.roles.map((r) => `- ${r.name}`).join('\n');

    const associationsList = context.associations
      .map((a) => {
        const role = context.roles.find((r) => r.id === a.role_id);
        const permission = context.permissions.find(
          (p) => p.id === a.permission_id
        );
        return `- ${role?.name || 'Unknown Role'} has ${permission?.name || 'Unknown Permission'}`;
      })
      .join('\n');

    return `Current RBAC System State:

PERMISSIONS:
${permissionsList || 'No permissions defined'}

ROLES:
${rolesList || 'No roles defined'}

ROLE-PERMISSION ASSOCIATIONS:
${associationsList || 'No associations defined'}`;
  }

  /**
   * Find permission by name (case-insensitive)
   */
  public async findPermissionByName(name: string) {
    const context = await this.getContext();
    return context.permissions.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Find role by name (case-insensitive)
   */
  public async findRoleByName(name: string) {
    const context = await this.getContext();
    return context.roles.find(
      (r) => r.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Check if role has permission
   */
  public async hasRolePermission(
    roleId: string,
    permissionId: string
  ): Promise<boolean> {
    const context = await this.getContext();
    return context.associations.some(
      (a) => a.role_id === roleId && a.permission_id === permissionId
    );
  }
}
