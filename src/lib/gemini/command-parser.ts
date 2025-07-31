import { getGeminiModel } from './config';
import { RBACContextManager } from './context-manager';
import { AICommand, AIResponse } from './types';

/**
 * Command parser that uses Gemini AI to interpret natural language commands
 */
export class CommandParser {
  private contextManager: RBACContextManager;

  constructor() {
    this.contextManager = RBACContextManager.getInstance();
  }

  /**
   * Parse natural language command into structured AI command
   */
  public async parseCommand(userInput: string): Promise<AIResponse> {
    try {
      const model = getGeminiModel();
      const contextString = await this.contextManager.getContextString();

      const prompt = this.buildPrompt(userInput, contextString);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      console.error('Error parsing command:', error);
      return {
        success: false,
        message: 'Failed to process your command. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Try rephrasing your command',
          "Check if you're using correct permission or role names",
          'Use simpler language',
        ],
      };
    }
  }

  /**
   * Build the AI prompt with context and examples
   */
  private buildPrompt(userInput: string, contextString: string): string {
    return `You are an RBAC (Role-Based Access Control) configuration assistant. Your job is to interpret natural language commands and convert them into structured actions.

${contextString}

SUPPORTED COMMANDS:
1. Create permission: "Create a new permission called [name]" or "Add permission [name] with description [desc]"
2. Create role: "Create a new role called [name]" or "Add role [name]"
3. Assign permission: "Give role [role_name] the permission [permission_name]" or "Assign [permission_name] to [role_name]"
4. Remove permission from role: "Remove permission [permission_name] from role [role_name]"
5. Delete permission: "Delete permission [permission_name]"
6. Delete role: "Delete role [role_name]"

USER COMMAND: "${userInput}"

Please analyze the command and respond with a JSON object in this exact format:
{
  "type": "create_permission|create_role|assign_permission|remove_permission|delete_permission|delete_role|unknown",
  "parameters": {
    // Include relevant parameters based on command type
    // For create_permission: {"name": "permission_name", "description": "optional_description"}
    // For create_role: {"name": "role_name"}
    // For assign_permission: {"role_name": "role_name", "permission_name": "permission_name"}
    // For remove_permission: {"role_name": "role_name", "permission_name": "permission_name"}
    // For delete_permission: {"name": "permission_name"}
    // For delete_role: {"name": "role_name"}
  },
  "confidence": 0.0-1.0,
  "message": "Human-readable explanation of what will be done",
  "validation_errors": ["array of any validation issues found"],
  "suggestions": ["array of helpful suggestions if command is unclear"]
}

VALIDATION RULES:
- Check if referenced permissions/roles exist in the current system
- Prevent duplicate creation of permissions/roles
- Ensure role-permission associations don't already exist when assigning
- Ensure associations exist when removing
- Provide helpful error messages for validation failures

Respond ONLY with the JSON object, no additional text.`;
  }

  /**
   * Parse the AI response and validate it
   */
  private parseAIResponse(aiResponse: string): AIResponse {
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        !parsed.type ||
        !parsed.parameters ||
        typeof parsed.confidence !== 'number'
      ) {
        throw new Error('Invalid AI response structure');
      }

      // Validate command type
      const validTypes = [
        'create_permission',
        'create_role',
        'assign_permission',
        'remove_permission',
        'delete_permission',
        'delete_role',
        'unknown',
      ];
      if (!validTypes.includes(parsed.type)) {
        parsed.type = 'unknown';
      }

      const command: AICommand = {
        type: parsed.type,
        parameters: parsed.parameters,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
      };

      return {
        success: parsed.type !== 'unknown' && parsed.confidence > 0.5,
        command,
        message: parsed.message || `Interpreted as: ${parsed.type}`,
        suggestions:
          parsed.validation_errors?.length > 0
            ? parsed.validation_errors
            : parsed.suggestions,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        success: false,
        message:
          "I couldn't understand your command. Please try rephrasing it.",
        error: 'Failed to parse AI response',
        suggestions: [
          'Try using simpler language',
          'Be more specific about what you want to do',
          'Use examples like: "Create a new permission called read_users"',
          'Or: "Give the admin role the read_users permission"',
        ],
      };
    }
  }

  /**
   * Validate command against current system state
   */
  public async validateCommand(
    command: AICommand
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      switch (command.type) {
        case 'create_permission':
          if (!command.parameters.name) {
            errors.push('Permission name is required');
          } else {
            const existing = await this.contextManager.findPermissionByName(
              command.parameters.name
            );
            if (existing) {
              errors.push(
                `Permission "${command.parameters.name}" already exists`
              );
            }
          }
          break;

        case 'create_role':
          if (!command.parameters.name) {
            errors.push('Role name is required');
          } else {
            const existing = await this.contextManager.findRoleByName(
              command.parameters.name
            );
            if (existing) {
              errors.push(`Role "${command.parameters.name}" already exists`);
            }
          }
          break;

        case 'assign_permission':
          if (
            !command.parameters.role_name ||
            !command.parameters.permission_name
          ) {
            errors.push('Both role name and permission name are required');
          } else {
            const role = await this.contextManager.findRoleByName(
              command.parameters.role_name
            );
            const permission = await this.contextManager.findPermissionByName(
              command.parameters.permission_name
            );

            if (!role) {
              errors.push(
                `Role "${command.parameters.role_name}" does not exist`
              );
            }
            if (!permission) {
              errors.push(
                `Permission "${command.parameters.permission_name}" does not exist`
              );
            }

            if (role && permission) {
              const hasPermission = await this.contextManager.hasRolePermission(
                role.id,
                permission.id
              );
              if (hasPermission) {
                errors.push(
                  `Role "${command.parameters.role_name}" already has permission "${command.parameters.permission_name}"`
                );
              }
            }
          }
          break;

        case 'remove_permission':
          if (
            !command.parameters.role_name ||
            !command.parameters.permission_name
          ) {
            errors.push('Both role name and permission name are required');
          } else {
            const role = await this.contextManager.findRoleByName(
              command.parameters.role_name
            );
            const permission = await this.contextManager.findPermissionByName(
              command.parameters.permission_name
            );

            if (!role) {
              errors.push(
                `Role "${command.parameters.role_name}" does not exist`
              );
            }
            if (!permission) {
              errors.push(
                `Permission "${command.parameters.permission_name}" does not exist`
              );
            }

            if (role && permission) {
              const hasPermission = await this.contextManager.hasRolePermission(
                role.id,
                permission.id
              );
              if (!hasPermission) {
                errors.push(
                  `Role "${command.parameters.role_name}" does not have permission "${command.parameters.permission_name}"`
                );
              }
            }
          }
          break;

        case 'delete_permission':
          if (!command.parameters.name) {
            errors.push('Permission name is required');
          } else {
            const existing = await this.contextManager.findPermissionByName(
              command.parameters.name
            );
            if (!existing) {
              errors.push(
                `Permission "${command.parameters.name}" does not exist`
              );
            }
          }
          break;

        case 'delete_role':
          if (!command.parameters.name) {
            errors.push('Role name is required');
          } else {
            const existing = await this.contextManager.findRoleByName(
              command.parameters.name
            );
            if (!existing) {
              errors.push(`Role "${command.parameters.name}" does not exist`);
            }
          }
          break;

        default:
          errors.push('Unknown command type');
      }
    } catch (error) {
      console.error('Error validating command:', error);
      errors.push('Failed to validate command against current system state');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
