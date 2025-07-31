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

    return NextResponse.json({
      data: {
        counts: {
          permissions: permissionsCount || 0,
          roles: rolesCount || 0,
          associations: associationsCount || 0,
        },
        recentActivity: {
          permissions: recentPermissions || [],
          roles: recentRoles || [],
        },
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
