import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { createPermissionSchema, searchSchema } from '@/lib/validations';
// import type { Permission } from '@/lib/types';

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
      .from('permissions')
      .select('*', { count: 'exact' })
      .order('name');

    // Apply search filter if query is provided
    if (query.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`
      );
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
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate request body
    const validation = createPermissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid permission data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check for duplicate name before insertion
    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', validation.data.name)
      .single();

    if (existingPermission) {
      return NextResponse.json(
        {
          error: 'Permission name already exists',
          message: `A permission with the name "${validation.data.name}" already exists. Please choose a different name.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('permissions')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json(
      {
        data,
        message: 'Permission created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating permission:', error);

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
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
