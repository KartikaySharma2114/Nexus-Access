import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { updateRoleSchema, idSchema } from '@/lib/validations';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate ID parameter
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }
      throw handleDatabaseError(error);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Validate ID parameter
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Validate request body
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid role data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if role exists
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }
      throw handleDatabaseError(fetchError);
    }

    // Check for duplicate name if name is being updated
    if (validation.data.name && validation.data.name !== existingRole.name) {
      const { data: duplicateRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', validation.data.name)
        .neq('id', id)
        .single();

      if (duplicateRole) {
        return NextResponse.json(
          {
            error: 'Role name already exists',
            message: `A role with the name "${validation.data.name}" already exists. Please choose a different name.`,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('roles')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({
      data,
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Error updating role:', error);

    // Handle duplicate name error from database constraint
    if (
      error instanceof Error &&
      (error.message.includes('duplicate key') ||
        error.message.includes('already exists'))
    ) {
      return NextResponse.json(
        {
          error: 'Role name already exists',
          message:
            'A role with this name already exists. Please choose a different name.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate ID parameter
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // First check if the role exists
    const { error: fetchError } = await supabase
      .from('roles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }
      throw handleDatabaseError(fetchError);
    }

    // Check if role has permission associations
    const { data: rolePermissions, error: permissionCheckError } =
      await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', id)
        .limit(1);

    if (permissionCheckError) {
      throw handleDatabaseError(permissionCheckError);
    }

    // Check if role has user assignments
    const { data: userRoles, error: userCheckError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', id)
      .limit(1);

    if (userCheckError) {
      throw handleDatabaseError(userCheckError);
    }

    // If role has associations, we'll cascade delete them
    // This is handled by the database CASCADE constraints
    if (
      (rolePermissions && rolePermissions.length > 0) ||
      (userRoles && userRoles.length > 0)
    ) {
      // Log the cascade deletion for audit purposes
      console.log(
        `Cascade deleting role ${id} with ${rolePermissions?.length || 0} permission associations and ${userRoles?.length || 0} user assignments`
      );
    }

    // Delete the role (CASCADE will handle related records)
    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({
      message: 'Role deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting role:', error);

    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key')) {
      return NextResponse.json(
        {
          error: 'Cannot delete role',
          message:
            'This role is referenced by other records and cannot be deleted.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
