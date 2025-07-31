import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { createRoleSchema, searchSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate search parameters
    const searchValidation = searchSchema.safeParse({ query, limit, offset });
    if (!searchValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: searchValidation.error.issues,
        },
        { status: 400 }
      );
    }

    let queryBuilder = supabase
      .from('roles')
      .select('*', { count: 'exact' })
      .order('name');

    // Apply search filter if query is provided
    if (query.trim()) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate request body
    const validation = createRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid role data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check for duplicate name before insertion
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', validation.data.name)
      .single();

    if (existingRole) {
      return NextResponse.json(
        {
          error: 'Role name already exists',
          message: `A role with the name "${validation.data.name}" already exists. Please choose a different name.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('roles')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json(
      {
        data,
        message: 'Role created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);

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
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
