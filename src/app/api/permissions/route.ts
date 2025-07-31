import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { createPermissionSchema, searchSchema } from '@/lib/validations';
import {
  withErrorHandling,
  createSuccessResponse,
} from '@/lib/api-error-handler';

const getHandler = withErrorHandling(
  async ({ query }) => {
    const supabase = await createClient();

    let queryBuilder = supabase
      .from('permissions')
      .select('*', { count: 'exact' })
      .order('name');

    // Apply search filter if query is provided
    if (query?.query?.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.query}%,description.ilike.%${query.query}%`
      );
    }

    // Apply pagination
    const offset = query?.offset || 0;
    const limit = query?.limit || 50;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw handleDatabaseError(error);
    }

    return createSuccessResponse({
      permissions: data || [],
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  },
  {
    validateQuery: searchSchema,
    rateLimit: { requests: 100, windowMs: 60000 }, // 100 requests per minute
  }
);

const postHandler = withErrorHandling(
  async ({ body }) => {
    const supabase = await createClient();

    // Check for duplicate name before insertion
    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', body.name)
      .single();

    if (existingPermission) {
      return createSuccessResponse(
        null,
        `A permission with the name "${body.name}" already exists. Please choose a different name.`,
        409
      );
    }

    const { data, error } = await supabase
      .from('permissions')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return createSuccessResponse(data, 'Permission created successfully', 201);
  },
  {
    validateBody: createPermissionSchema,
    rateLimit: { requests: 20, windowMs: 60000 }, // 20 creates per minute
  }
);

export { getHandler as GET, postHandler as POST };
