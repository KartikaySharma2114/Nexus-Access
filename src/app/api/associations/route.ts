import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAssociationSchema,
  deleteAssociationSchema,
} from '@/lib/validations';

// GET /api/associations - Get all role-permission associations
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all associations with role and permission details
    const { data: associations, error } = await supabase.from(
      'role_permissions'
    ).select(`
        role_id,
        permission_id,
        roles!inner(id, name),
        permissions!inner(id, name, description)
      `);

    if (error) {
      console.error('Error fetching associations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch associations' },
        { status: 500 }
      );
    }

    // Flatten the data to prevent circular references
    const flattenedData = associations.map((a) => ({
      role_id: a.roles.id,
      role_name: a.roles.name,
      permission_id: a.permissions.id,
      permission_name: a.permissions.name,
      permission_description: a.permissions.description,
    }));

    return NextResponse.json({ data: flattenedData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/associations - Create new role-permission association
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input data
    const validation = createAssociationSchema.safeParse(body);
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

    const { role_id, permission_id } = validation.data;

    // Verify that role and permission exist
    const [roleCheck, permissionCheck] = await Promise.all([
      supabase.from('roles').select('id').eq('id', role_id).single(),
      supabase
        .from('permissions')
        .select('id')
        .eq('id', permission_id)
        .single(),
    ]);

    if (roleCheck.error) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if association already exists
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', role_id)
      .eq('permission_id', permission_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Association already exists' },
        { status: 409 }
      );
    }

    // Create the association
    const { data: association, error } = await supabase
      .from('role_permissions')
      .insert({ role_id, permission_id })
      .select()
      .single();

    if (error) {
      console.error('Error creating association:', error);
      return NextResponse.json(
        { error: 'Failed to create association' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: association }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/associations - Remove role-permission association
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const roleIdParam = searchParams.get('role_id');
    const permissionIdParam = searchParams.get('permission_id');

    // Validate input data
    const validation = deleteAssociationSchema.safeParse({
      role_id: roleIdParam,
      permission_id: permissionIdParam,
    });
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

    const { role_id, permission_id } = validation.data;

    // Check if association exists before attempting to delete
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', role_id)
      .eq('permission_id', permission_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', role_id)
      .eq('permission_id', permission_id);

    if (error) {
      console.error('Error deleting association:', error);
      return NextResponse.json(
        { error: 'Failed to delete association' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Association deleted successfully',
      data: { role_id, permission_id },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
