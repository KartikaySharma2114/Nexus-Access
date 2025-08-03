import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get counts for all entities in parallel
    const [
      { count: permissionsCount, error: permissionsError },
      { count: rolesCount, error: rolesError },
      { count: associationsCount, error: associationsError },
    ] = await Promise.all([
      supabase.from('permissions').select('*', { count: 'exact', head: true }),
      supabase.from('roles').select('*', { count: 'exact', head: true }),
      supabase
        .from('role_permissions')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (permissionsError || rolesError || associationsError) {
      console.error('Error fetching dashboard stats:', {
        permissionsError,
        rolesError,
        associationsError,
      });
      return NextResponse.json(
        { error: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      );
    }

    // Get recent activity (last 10 permissions and roles created)
    const [
      { data: recentPermissions, error: recentPermissionsError },
      { data: recentRoles, error: recentRolesError },
    ] = await Promise.all([
      supabase
        .from('permissions')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('roles')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (recentPermissionsError || recentRolesError) {
      console.error('Error fetching recent activity:', {
        recentPermissionsError,
        recentRolesError,
      });
    }

    // Format recent activity to match the expected interface
    const recentActivity: Array<{
      id: string;
      type: 'role_created' | 'permission_created' | 'association_created' | 'association_deleted';
      description: string;
      timestamp: string;
    }> = [];
    
    // Add recent permissions
    if (recentPermissions) {
      recentPermissions.forEach(permission => {
        recentActivity.push({
          id: `permission_${permission.id}`,
          type: 'permission_created' as const,
          description: `Permission "${permission.name}" was created`,
          timestamp: permission.created_at,
        });
      });
    }
    
    // Add recent roles
    if (recentRoles) {
      recentRoles.forEach(role => {
        recentActivity.push({
          id: `role_${role.id}`,
          type: 'role_created' as const,
          description: `Role "${role.name}" was created`,
          timestamp: role.created_at,
        });
      });
    }
    
    // Sort by timestamp (most recent first) and limit to 10
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivity = recentActivity.slice(0, 10);

    return NextResponse.json({
      data: {
        totalPermissions: permissionsCount || 0,
        totalRoles: rolesCount || 0,
        totalAssociations: associationsCount || 0,
        recentActivity: limitedActivity,
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
