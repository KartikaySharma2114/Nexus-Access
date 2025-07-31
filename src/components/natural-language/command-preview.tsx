'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Eye,
  Play,
  X,
  AlertTriangle,
  Info,
  Shield,
  Users,
  Link2,
  Trash2,
} from 'lucide-react';
import { AICommand } from '@/lib/gemini/types';

interface CommandPreviewProps {
  command: AICommand | null;
  message: string;
  onExecute: () => Promise<void>;
  onCancel: () => void;
  isExecuting: boolean;
  suggestions?: string[];
}

export function CommandPreview({
  command,
  message,
  onExecute,
  onCancel,
  isExecuting,
  suggestions = [],
}: CommandPreviewProps) {
  if (!command) {
    return null;
  }

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'create_permission':
      case 'delete_permission':
        return Shield;
      case 'create_role':
      case 'delete_role':
        return Users;
      case 'assign_permission':
      case 'remove_permission':
        return Link2;
      default:
        return Info;
    }
  };

  const getCommandColor = (type: string) => {
    switch (type) {
      case 'create_permission':
      case 'create_role':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'delete_permission':
      case 'delete_role':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'assign_permission':
      case 'remove_permission':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActionDescription = (command: AICommand) => {
    switch (command.type) {
      case 'create_permission':
        return {
          title: 'Create Permission',
          description: `Create a new permission named "${command.parameters.name}"`,
          details: command.parameters.description
            ? `Description: ${command.parameters.description}`
            : 'No description provided',
        };
      case 'create_role':
        return {
          title: 'Create Role',
          description: `Create a new role named "${command.parameters.name}"`,
          details: 'Role will be created with no permissions assigned',
        };
      case 'assign_permission':
        return {
          title: 'Assign Permission',
          description: `Assign permission "${command.parameters.permission_name}" to role "${command.parameters.role_name}"`,
          details: 'This will create a new role-permission association',
        };
      case 'remove_permission':
        return {
          title: 'Remove Permission',
          description: `Remove permission "${command.parameters.permission_name}" from role "${command.parameters.role_name}"`,
          details: 'This will delete the role-permission association',
        };
      case 'delete_permission':
        return {
          title: 'Delete Permission',
          description: `Delete permission "${command.parameters.name}"`,
          details:
            'This will also remove all role associations for this permission',
        };
      case 'delete_role':
        return {
          title: 'Delete Role',
          description: `Delete role "${command.parameters.name}"`,
          details:
            'This will also remove all permission associations for this role',
        };
      default:
        return {
          title: 'Unknown Action',
          description: 'Unable to determine the action to perform',
          details: 'Please try rephrasing your command',
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const Icon = getCommandIcon(command.type);
  const actionInfo = getActionDescription(command);
  const colorClasses = getCommandColor(command.type);

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Command Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={getConfidenceColor(command.confidence)}
            >
              {getConfidenceLabel(command.confidence)} Confidence (
              {Math.round(command.confidence * 100)}%)
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Summary */}
        <div className={`p-4 rounded-lg border ${colorClasses}`}>
          <div className="flex items-start space-x-3">
            <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{actionInfo.title}</h3>
              <p className="text-sm mt-1">{actionInfo.description}</p>
              <p className="text-xs mt-2 opacity-75">{actionInfo.details}</p>
            </div>
          </div>
        </div>

        {/* AI Interpretation */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Interpretation:</strong> {message}
          </AlertDescription>
        </Alert>

        {/* Parameters */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Command Parameters:</h4>
          <div className="bg-muted p-3 rounded-md">
            <pre className="text-xs font-mono">
              {JSON.stringify(command.parameters, null, 2)}
            </pre>
          </div>
        </div>

        {/* Suggestions/Warnings */}
        {suggestions.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Issues found:</strong>
                <ul className="list-disc list-inside text-sm">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Low confidence warning */}
        {command.confidence < 0.6 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Confidence Warning:</strong> The AI is not very
              confident about this interpretation. Please review the command
              carefully before executing.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isExecuting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onExecute}
            disabled={isExecuting || command.confidence < 0.3}
            className={
              command.type.includes('delete')
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Executing...
              </>
            ) : (
              <>
                {command.type.includes('delete') ? (
                  <Trash2 className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Execute Command
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
