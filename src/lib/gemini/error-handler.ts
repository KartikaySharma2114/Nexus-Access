import { AIResponse } from './types';

/**
 * Error handler for AI service operations
 */
export class AIErrorHandler {
  private static readonly FALLBACK_SUGGESTIONS = [
    'Try rephrasing your command using simpler language',
    'Make sure you are using exact permission or role names',
    'Check if the permission or role you are referencing exists',
    'Use commands like "Create permission [name]" or "Give [role] the [permission] permission"',
  ];

  /**
   * Main error handler
   */
  public static handleError(error: unknown): AIResponse {
    return {
      success: false,
      message: 'There was an issue processing your command. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: this.FALLBACK_SUGGESTIONS,
    };
  }

  /**
   * Handle service unavailable errors
   */
  public static handleServiceUnavailable(): AIResponse {
    return {
      success: false,
      message:
        'The AI assistant is currently unavailable. Please use the manual interface to manage your RBAC settings.',
      error: 'AI service is not configured or unavailable',
      suggestions: [
        'Use the Permissions tab to manage permissions manually',
        'Use the Roles tab to manage roles manually',
        'Use the Associations tab to link permissions to roles',
      ],
    };
  }
}
