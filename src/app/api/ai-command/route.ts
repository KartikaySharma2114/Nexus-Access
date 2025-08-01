import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiService } from '@/lib/gemini/ai-service';
import { AICommand, CommandExecutionResult } from '@/lib/gemini/types';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
          error: 'Request body must be valid JSON',
          suggestions: ['Check your request format'],
        },
        { status: 400 }
      );
    }

    const { command } = body;

    // Check if this is a parsed command (object) or a string command to process
    if (typeof command === 'object' && command !== null && 'type' in command) {
      // This is a parsed AICommand object - execute it directly
      const supabase = await createClient();
      const executionResult = await executeCommand(
        supabase,
        command as AICommand
      );

      return NextResponse.json({
        success: executionResult.success,
        message: executionResult.message,
        error: executionResult.error,
        data: executionResult.data,
        parsedCommand: command,
      });
    }

    // This is a string command - process it first
    const userInput = command;

    // Validate input
    if (
      !userInput ||
      typeof userInput !== 'string' ||
      userInput.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid command format',
          error: 'Command must be a non-empty string or parsed command object',
          suggestions: [
            'Try: "Create a new permission called read_users"',
            'Or: "Give the admin role the read_users permission"',
          ],
        },
        { status: 400 }
      );
    }

    // Check if AI service is available
    const isAvailable = await aiService.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI service is currently unavailable',
          error: 'Google Gemini API key is not configured',
          suggestions: [
            'Use the manual interface to manage permissions and roles',
            'Contact your administrator to configure the AI service',
          ],
        },
        { status: 503 }
      );
    }

    // Process the natural language command
    const aiResponse = await aiService.processCommand(userInput.trim());

    // If AI processing failed, return the error
    if (!aiResponse.success || !aiResponse.command) {
      return NextResponse.json({
        success: false,
        message: aiResponse.message,
        error: aiResponse.error,
        suggestions: aiResponse.suggestions,
        parsedCommand: null,
      });
    }

    // Execute the parsed command
    const supabase = await createClient();
    const executionResult = await executeCommand(supabase, aiResponse.command);

    // Return structured response
    return NextResponse.json({
      success: executionResult.success,
      message: executionResult.message,
      error: executionResult.error,
      data: executionResult.data,
      parsedCommand: aiResponse.command,
      suggestions: executionResult.success ? [] : aiResponse.suggestions,
    });
  } catch (error) {
    console.error('Error processing AI command:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while processing command',
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Try rephrasing your command',
          'Check if the AI service is properly configured',
          'Use the manual interface as an alternative',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Execute a parsed AI command against the database
 */
async function executeCommand(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  switch (command.type) {
    case 'create_permission':
      return await createPermission(supabase, command);
    case 'create_role':
      return await createRole(supabase, command);
    case 'assign_permission':
      return await assignPermission(supabase, command);
    case 'remove_permission':
      return await removePermission(supabase, command);
    case 'delete_permission':
      return await deletePermission(supabase, command);
    case 'delete_role':
      return await deleteRole(supabase, command);
    default:
      return {
        success: false,
        message: 'Unknown command type',
        error: `Unsupported command type: ${command.type}`,
      };
  }
}

async function createPermission(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { name, description } = command.parameters;

  if (!name) {
    return {
      success: false,
      message: 'Permission name is required',
      error: 'Missing permission name',
    };
  }

  // Check if permission already exists
  const { data: existing } = await supabase
    .from('permissions')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    return {
      success: false,
      message: `Permission "${name}" already exists`,
      error: 'Duplicate permission name',
    };
  }

  const { data, error } = await supabase
    .from('permissions')
    .insert([{ name, description: description || null }])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: 'Failed to create permission',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Permission "${name}" created successfully`,
    data,
  };
}

async function createRole(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { name } = command.parameters;

  if (!name) {
    return {
      success: false,
      message: 'Role name is required',
      error: 'Missing role name',
    };
  }

  // Check if role already exists
  const { data: existing } = await supabase
    .from('roles')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    return {
      success: false,
      message: `Role "${name}" already exists`,
      error: 'Duplicate role name',
    };
  }

  const { data, error } = await supabase
    .from('roles')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: 'Failed to create role',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Role "${name}" created successfully`,
    data,
  };
}

async function assignPermission(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { role_name, permission_name } = command.parameters;

  if (!role_name || !permission_name) {
    return {
      success: false,
      message: 'Both role name and permission name are required',
      error: 'Missing required parameters',
    };
  }

  // Find role and permission
  const [roleResult, permissionResult] = await Promise.all([
    supabase.from('roles').select('id, name').eq('name', role_name).single(),
    supabase
      .from('permissions')
      .select('id, name')
      .eq('name', permission_name)
      .single(),
  ]);

  if (roleResult.error) {
    return {
      success: false,
      message: `Role "${role_name}" not found`,
      error: 'Role does not exist',
    };
  }

  if (permissionResult.error) {
    return {
      success: false,
      message: `Permission "${permission_name}" not found`,
      error: 'Permission does not exist',
    };
  }

  const role = roleResult.data;
  const permission = permissionResult.data;

  // Check if association already exists
  const { data: existing } = await supabase
    .from('role_permissions')
    .select('role_id, permission_id')
    .eq('role_id', role.id)
    .eq('permission_id', permission.id)
    .single();

  if (existing) {
    return {
      success: false,
      message: `Role "${role_name}" already has permission "${permission_name}"`,
      error: 'Association already exists',
    };
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .insert([{ role_id: role.id, permission_id: permission.id }])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: 'Failed to assign permission',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Permission "${permission_name}" assigned to role "${role_name}" successfully`,
    data,
  };
}

async function removePermission(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { role_name, permission_name } = command.parameters;

  if (!role_name || !permission_name) {
    return {
      success: false,
      message: 'Both role name and permission name are required',
      error: 'Missing required parameters',
    };
  }

  // Find role and permission
  const [roleResult, permissionResult] = await Promise.all([
    supabase.from('roles').select('id, name').eq('name', role_name).single(),
    supabase
      .from('permissions')
      .select('id, name')
      .eq('name', permission_name)
      .single(),
  ]);

  if (roleResult.error) {
    return {
      success: false,
      message: `Role "${role_name}" not found`,
      error: 'Role does not exist',
    };
  }

  if (permissionResult.error) {
    return {
      success: false,
      message: `Permission "${permission_name}" not found`,
      error: 'Permission does not exist',
    };
  }

  const role = roleResult.data;
  const permission = permissionResult.data;

  // Check if association exists
  const { data: existing } = await supabase
    .from('role_permissions')
    .select('role_id, permission_id')
    .eq('role_id', role.id)
    .eq('permission_id', permission.id)
    .single();

  if (!existing) {
    return {
      success: false,
      message: `Role "${role_name}" does not have permission "${permission_name}"`,
      error: 'Association does not exist',
    };
  }

  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', role.id)
    .eq('permission_id', permission.id);

  if (error) {
    return {
      success: false,
      message: 'Failed to remove permission',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Permission "${permission_name}" removed from role "${role_name}" successfully`,
  };
}

async function deletePermission(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { name } = command.parameters;

  if (!name) {
    return {
      success: false,
      message: 'Permission name is required',
      error: 'Missing permission name',
    };
  }

  // Find permission
  const { data: permission, error: findError } = await supabase
    .from('permissions')
    .select('id, name')
    .eq('name', name)
    .single();

  if (findError) {
    return {
      success: false,
      message: `Permission "${name}" not found`,
      error: 'Permission does not exist',
    };
  }

  // Delete associated role_permissions first
  await supabase
    .from('role_permissions')
    .delete()
    .eq('permission_id', permission.id);

  // Delete the permission
  const { error } = await supabase
    .from('permissions')
    .delete()
    .eq('id', permission.id);

  if (error) {
    return {
      success: false,
      message: 'Failed to delete permission',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Permission "${name}" deleted successfully`,
  };
}

async function deleteRole(
  supabase: SupabaseClient,
  command: AICommand
): Promise<CommandExecutionResult> {
  const { name } = command.parameters;

  if (!name) {
    return {
      success: false,
      message: 'Role name is required',
      error: 'Missing role name',
    };
  }

  // Find role
  const { data: role, error: findError } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', name)
    .single();

  if (findError) {
    return {
      success: false,
      message: `Role "${name}" not found`,
      error: 'Role does not exist',
    };
  }

  // Delete associated role_permissions first
  await supabase.from('role_permissions').delete().eq('role_id', role.id);

  // Delete the role
  const { error } = await supabase.from('roles').delete().eq('id', role.id);

  if (error) {
    return {
      success: false,
      message: 'Failed to delete role',
      error: error.message,
    };
  }

  return {
    success: true,
    message: `Role "${name}" deleted successfully`,
  };
}
