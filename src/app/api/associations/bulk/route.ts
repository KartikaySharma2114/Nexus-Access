import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Bulk operation validation schema
const bulkOperationSchema = z.object({
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  permission_ids: z
    .array(z.string().uuid({ message: 'Invalid permission ID' }))
    .min(1, 'At least one permission is required'),
  operation: z.enum(['assign', 'unassign'], {
    message: 'Operation must be either "assign" or "unassign"',
  }),
});

// POST /api/associations/bulk - Bulk assign permissions to a role
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input data
    const validation = bulkOperationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { role_id, permission_ids, operation } = validation.data;

    // Verify that role exists
    const { data: roleExists, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('id', role_id)
      .single();

    if (roleError || !roleExists) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Verify that all permissions exist
    const { data: existingPermissions, error: permissionsError } =
      await supabase.from('permissions').select('id').in('id', permission_ids);

    if (permissionsError) {
      console.error('Error checking permissions:', permissionsError);
      return NextResponse.json(
        { error: 'Failed to verify permissions' },
        { status: 500 }
      );
    }

    const existingPermissionIds = existingPermissions?.map((p) => p.id) || [];
    const missingPermissions = permission_ids.filter(
      (id) => !existingPermissionIds.includes(id)
    );

    if (missingPermissions.length > 0) {
      return NextResponse.json(
        {
          error: 'Some permissions not found',
          details: { missing_permission_ids: missingPermissions },
        },
        { status: 404 }
      );
    }

    if (operation === 'assign') {
      // Bulk assign permissions to role
      const associations = permission_ids.map((permission_id) => ({
        role_id,
        permission_id,
      }));

      // Use upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from('role_permissions')
        .upsert(associations, { onConflict: 'role_id,permission_id' })
        .select();

      if (error) {
        console.error('Error bulk assigning permissions:', error);
        return NextResponse.json(
          { error: 'Failed to assign permissions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data,
        message: `Successfully assigned ${permission_ids.length} permissions to role`,
        details: {
          role_id,
          permission_ids,
          operation: 'assign',
        },
      });
    } else {
      // Bulk unassign permissions from role
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', role_id)
        .in('permission_id', permission_ids);

      if (error) {
        console.error('Error bulk unassigning permissions:', error);
        return NextResponse.json(
          { error: 'Failed to unassign permissions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Successfully unassigned ${permission_ids.length} permissions from role`,
        details: {
          role_id,
          permission_ids,
          operation: 'unassign',
        },
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
