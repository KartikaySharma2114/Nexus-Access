import { CommandParser } from './command-parser';
import { RBACContextManager } from './context-manager';
import { AIErrorHandler } from './error-handler';
import { AIResponse } from './types';

/**
 * Main AI service for processing natural language RBAC commands
 */
export class AIService {
  private parser: CommandParser;
  private contextManager: RBACContextManager;

  constructor() {
    this.parser = new CommandParser();
    this.contextManager = RBACContextManager.getInstance();
  }

  /**
   * Process a natural language command
   */
  public async processCommand(userInput: string): Promise<AIResponse> {
    try {
      // Validate input
      if (!userInput || userInput.trim().length === 0) {
        return {
          success: false,
          message: 'Please enter a command to process.',
          suggestions: [
            'Try: "Create a new permission called read_users"',
            'Or: "Give the admin role the read_users permission"',
          ],
        };
      }

      // Refresh context before processing
      await this.contextManager.refreshContext();

      // Parse the command
      const response = await this.parser.parseCommand(userInput.trim());

      // If parsing failed, return the error response
      if (!response.success || !response.command) {
        return response;
      }

      // Validate the parsed command
      const validation = await this.parser.validateCommand(response.command);
      if (!validation.valid) {
        return {
          success: false,
          command: response.command,
          message: 'Command validation failed',
          error: validation.errors.join(', '),
          suggestions: [
            ...validation.errors,
            'Check if the referenced permissions or roles exist',
            'Try using the exact names as they appear in the system',
          ],
        };
      }

      // Return successful parsed and validated command
      return {
        success: true,
        command: response.command,
        message: response.message,
        suggestions: response.suggestions,
      };
    } catch (error) {
      console.error('Error processing AI command:', error);
      return AIErrorHandler.handleError(error);
    }
  }

  /**
   * Get command suggestions based on current system state
   */
  public async getCommandSuggestions(): Promise<string[]> {
    try {
      const context = await this.contextManager.getContext();
      const suggestions: string[] = [];

      // Basic creation suggestions
      suggestions.push('Create a new permission called [permission_name]');
      suggestions.push('Create a new role called [role_name]');

      // If we have permissions and roles, suggest associations
      if (context.permissions.length > 0 && context.roles.length > 0) {
        const samplePermission = context.permissions[0].name;
        const sampleRole = context.roles[0].name;
        suggestions.push(
          `Give the ${sampleRole} role the ${samplePermission} permission`
        );
        suggestions.push(
          `Remove ${samplePermission} permission from ${sampleRole} role`
        );
      }

      // Suggest specific permissions/roles if they exist
      if (context.permissions.length > 0) {
        const permission =
          context.permissions[
            Math.floor(Math.random() * context.permissions.length)
          ];
        suggestions.push(`Delete the ${permission.name} permission`);
      }

      if (context.roles.length > 0) {
        const role =
          context.roles[Math.floor(Math.random() * context.roles.length)];
        suggestions.push(`Delete the ${role.name} role`);
      }

      return suggestions.slice(0, 6); // Limit to 6 suggestions
    } catch (error) {
      console.error('Error getting command suggestions:', error);
      return [
        'Create a new permission called read_users',
        'Create a new role called editor',
        'Give the admin role the read_users permission',
        'Remove write_posts permission from guest role',
        'Delete the old_permission permission',
        'Delete the unused_role role',
      ];
    }
  }

  /**
   * Get help text for natural language commands
   */
  public getHelpText(): string {
    return `Natural Language Commands Help:

CREATING ITEMS:
• "Create a new permission called [name]"
• "Add permission [name] with description [description]"
• "Create a new role called [name]"
• "Add role [name]"

MANAGING ASSOCIATIONS:
• "Give [role_name] the [permission_name] permission"
• "Assign [permission_name] to [role_name]"
• "Remove [permission_name] from [role_name]"
• "Take away [permission_name] permission from [role_name]"

DELETING ITEMS:
• "Delete the [permission_name] permission"
• "Remove permission [permission_name]"
• "Delete the [role_name] role"
• "Remove role [role_name]"

TIPS:
• Use exact names as they appear in your system
• Be specific about what you want to do
• You can use natural variations of these commands
• If a command fails, try rephrasing it`;
  }

  /**
   * Check if AI service is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      return Boolean(apiKey && apiKey.trim().length > 0);
    } catch (error) {
      console.error('Error checking AI service availability:', error);
      return false;
    }
  }

  /**
   * Get current system context for display
   */
  public async getSystemContext() {
    try {
      return await this.contextManager.getContext();
    } catch (error) {
      console.error('Error getting system context:', error);
      return {
        permissions: [],
        roles: [],
        associations: [],
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
