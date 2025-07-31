import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { updatePermissionSchema, idSchema } from '@/lib/validations';

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
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw handleDatabaseError(error);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission' },
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
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = updatePermissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid permission data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if permission exists
    const { data: existingPermission, error: fetchError } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw handleDatabaseError(fetchError);
    }

    // Check for duplicate name if name is being updated
    if (
      validation.data.name &&
      validation.data.name !== existingPermission.name
    ) {
      const { data: duplicatePermission } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', validation.data.name)
        .neq('id', id)
        .single();

      if (duplicatePermission) {
        return NextResponse.json(
          {
            error: 'Permission name already exists',
            message: `A permission with the name "${validation.data.name}" already exists. Please choose a different name.`,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('permissions')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({
      data,
      message: 'Permission updated successfully',
    });
  } catch (error) {
    console.error('Error updating permission:', error);

    // Handle duplicate name error from database constraint
    if (
      error instanceof Error &&
      (error.message.includes('duplicate key') ||
        error.message.includes('already exists'))
    ) {
      return NextResponse.json(
        {
          error: 'Permission name already exists',
          message:
            'A permission with this name already exists. Please choose a different name.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update permission' },
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
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    // First check if the permission exists
    const { error: fetchError } = await supabase
      .from('permissions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Permission not found' },
          { status: 404 }
        );
      }
      throw handleDatabaseError(fetchError);
    }

    // Check if permission is assigned to any roles
    const { data: rolePermissions, error: roleCheckError } = await supabase
      .from('role_permissions')
      .select('role_id')
      .eq('permission_id', id)
      .limit(1);

    if (roleCheckError) {
      throw handleDatabaseError(roleCheckError);
    }

    if (rolePermissions && rolePermissions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete permission',
          message:
            'This permission is currently assigned to one or more roles. Please remove all role assignments before deleting.',
        },
        { status: 409 }
      );
    }

    // Delete the permission
    const { error } = await supabase.from('permissions').delete().eq('id', id);

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({
      message: 'Permission deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting permission:', error);

    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key')) {
      return NextResponse.json(
        {
          error: 'Cannot delete permission',
          message:
            'This permission is referenced by other records and cannot be deleted.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}
