// Types for AI command processing

export interface AICommand {
  type:
    | 'create_permission'
    | 'create_role'
    | 'assign_permission'
    | 'remove_permission'
    | 'delete_permission'
    | 'delete_role'
    | 'unknown';
  parameters: Record<string, string>;
  confidence: number;
}

export interface AIResponse {
  success: boolean;
  command?: AICommand;
  message: string;
  error?: string;
  suggestions?: string[];
}

export interface RBACContext {
  permissions: Array<{ id: string; name: string; description?: string }>;
  roles: Array<{ id: string; name: string }>;
  associations: Array<{ role_id: string; permission_id: string }>;
}

export interface CommandExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
