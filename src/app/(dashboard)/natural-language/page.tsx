'use client';

import { useState, useEffect } from 'react';
import { NaturalLanguageInput } from '@/components/natural-language/natural-language-input';
import {
  CommandHistory,
  CommandHistoryItem,
} from '@/components/natural-language/command-history';
import { CommandPreview } from '@/components/natural-language/command-preview';
import { AIResponseDisplay } from '@/components/natural-language/ai-response-display';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
// Note: AI service calls are made via API routes to avoid server-side imports in client components
import { AICommand, AIResponse } from '@/lib/gemini/types';

export default function NaturalLanguagePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [helpText, setHelpText] = useState('');
  const [currentCommand, setCurrentCommand] = useState<AICommand | null>(null);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(
    null
  );
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [lastInput, setLastInput] = useState('');

  // Initialize AI service and load suggestions
  useEffect(() => {
    const initializeAI = async () => {
      try {
        // Check AI availability
        const availabilityResponse = await fetch(
          '/api/ai-service/availability'
        );
        const { available } = await availabilityResponse.json();
        setIsAIAvailable(available);

        if (available) {
          // Load suggestions and help text
          const [suggestionsResponse, helpResponse] = await Promise.all([
            fetch('/api/ai-service/suggestions'),
            fetch('/api/ai-service/help'),
          ]);

          const { suggestions: commandSuggestions } =
            await suggestionsResponse.json();
          const { helpText: help } = await helpResponse.json();

          setSuggestions(commandSuggestions);
          setHelpText(help);
        }
      } catch (error) {
        console.error('Failed to initialize AI service:', error);
        setIsAIAvailable(false);
      }
    };

    initializeAI();
  }, []);

  const handleCommandSubmit = async (command: string) => {
    if (!command.trim()) return;

    setIsLoading(true);
    setLastInput(command);
    setCurrentCommand(null);
    setCurrentResponse(null);

    try {
      const processResponse = await fetch('/api/ai-service/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const response = await processResponse.json();
      setCurrentResponse(response);

      if (response.success && response.command) {
        setCurrentCommand(response.command);
      } else {
        // Add failed command to history immediately
        const historyItem: CommandHistoryItem = {
          id: Date.now().toString(),
          command,
          timestamp: new Date(),
          success: false,
          message: response.message,
          error: response.error,
        };
        setHistory((prev) => [historyItem, ...prev]);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command,
        timestamp: new Date(),
        success: false,
        message: 'Failed to process command',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setHistory((prev) => [historyItem, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommandExecute = async () => {
    if (!currentCommand || !currentResponse) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Execute the command via API
      const response = await fetch('/api/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: currentCommand }),
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command: lastInput,
        timestamp: new Date(),
        success: result.success,
        message: result.message,
        error: result.error,
        executionTime,
      };

      setHistory((prev) => [historyItem, ...prev]);

      // Update response with execution result
      setCurrentResponse({
        ...currentResponse,
        success: result.success,
        message: result.message,
        error: result.error,
      });

      // Clear current command after execution
      if (result.success) {
        setCurrentCommand(null);
        // Refresh suggestions after successful execution
        try {
          const suggestionsResponse = await fetch(
            '/api/ai-service/suggestions'
          );
          const { suggestions: newSuggestions } =
            await suggestionsResponse.json();
          setSuggestions(newSuggestions);
        } catch (error) {
          console.error('Failed to refresh suggestions:', error);
        }
      }
    } catch (error) {
      console.error('Error executing command:', error);
      const executionTime = Date.now() - startTime;

      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command: lastInput,
        timestamp: new Date(),
        success: false,
        message: 'Failed to execute command',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };

      setHistory((prev) => [historyItem, ...prev]);

      setCurrentResponse({
        ...currentResponse,
        success: false,
        message: 'Failed to execute command',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCommandCancel = () => {
    setCurrentCommand(null);
    setCurrentResponse(null);
  };

  const handleRetryCommand = async (command: string) => {
    await handleCommandSubmit(command);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDismissResponse = () => {
    setCurrentResponse(null);
  };

  const handleRetryResponse = () => {
    if (lastInput) {
      handleCommandSubmit(lastInput);
    }
  };

  const handleRefreshAI = async () => {
    setIsAIAvailable(null);

    try {
      const availabilityResponse = await fetch('/api/ai-service/availability');
      const { available } = await availabilityResponse.json();
      setIsAIAvailable(available);

      if (available) {
        const [suggestionsResponse, helpResponse] = await Promise.all([
          fetch('/api/ai-service/suggestions'),
          fetch('/api/ai-service/help'),
        ]);

        const { suggestions: commandSuggestions } =
          await suggestionsResponse.json();
        const { helpText: help } = await helpResponse.json();

        setSuggestions(commandSuggestions);
        setHelpText(help);
      }
    } catch (error) {
      console.error('Failed to refresh AI data:', error);
      setIsAIAvailable(false);
    }
  };

  if (isAIAvailable === null) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Initializing AI service...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAIAvailable) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              <span>Natural Language Configuration</span>
              <Badge variant="destructive">Unavailable</Badge>
            </CardTitle>
            <CardDescription>
              AI service is not available. Please check your configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The AI service is not properly configured. Please ensure you
                have:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Set the GOOGLE_GEMINI_API_KEY environment variable</li>
                  <li>Restarted the application after adding the API key</li>
                  <li>Verified your API key is valid</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={handleRefreshAI} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5 text-green-500" />
            <span>Natural Language Configuration</span>
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Configure RBAC settings using plain English commands. Type your
            commands naturally and let AI interpret them.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <NaturalLanguageInput
        onSubmit={handleCommandSubmit}
        isLoading={isLoading}
        suggestions={suggestions}
        helpText={helpText}
      />

      {/* Command Preview */}
      {currentCommand && (
        <CommandPreview
          command={currentCommand}
          message={currentResponse?.message || ''}
          onExecute={handleCommandExecute}
          onCancel={handleCommandCancel}
          isExecuting={isExecuting}
          suggestions={currentResponse?.suggestions}
        />
      )}

      {/* AI Response Display */}
      {currentResponse && !currentCommand && (
        <AIResponseDisplay
          response={currentResponse}
          onRetry={handleRetryResponse}
          onDismiss={handleDismissResponse}
        />
      )}

      {/* Command History */}
      <CommandHistory
        history={history}
        onRetry={handleRetryCommand}
        onClear={handleClearHistory}
      />
    </div>
  );
}
