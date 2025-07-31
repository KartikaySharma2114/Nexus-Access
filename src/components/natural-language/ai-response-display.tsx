'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { AIResponse } from '@/lib/gemini/types';

interface AIResponseDisplayProps {
  response: AIResponse | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function AIResponseDisplay({
  response,
  onRetry,
  onDismiss,
  showDismiss = true,
}: AIResponseDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!response) {
    return null;
  }

  const handleCopyResponse = async () => {
    try {
      const textToCopy = `Command: ${response.command?.type || 'Unknown'}
Parameters: ${JSON.stringify(response.command?.parameters || {}, null, 2)}
Message: ${response.message}
${response.error ? `Error: ${response.error}` : ''}
${response.suggestions ? `Suggestions: ${response.suggestions.join(', ')}` : ''}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy response:', error);
    }
  };

  const getResponseIcon = () => {
    if (response.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getResponseVariant = () => {
    if (response.success) {
      return 'default';
    }
    return 'destructive';
  };

  const getCardBorderClass = () => {
    if (response.success) {
      return 'border-green-200 bg-green-50/30';
    }
    return 'border-red-200 bg-red-50/30';
  };

  return (
    <Card className={`${getCardBorderClass()} transition-all duration-200`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getResponseIcon()}
            <span>AI Response</span>
            <Badge variant={response.success ? 'default' : 'destructive'}>
              {response.success ? 'Success' : 'Failed'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyResponse}
              className="h-8 w-8 p-0"
              title="Copy response details"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-8 w-8 p-0"
                title="Retry command"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0"
                title="Dismiss response"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Message */}
        <Alert variant={getResponseVariant()}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Response:</strong> {response.message}
          </AlertDescription>
        </Alert>

        {/* Command Details */}
        {response.command && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Command Details:</h4>
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type:</span>
                <Badge variant="outline">{response.command.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence:</span>
                <Badge
                  variant="outline"
                  className={
                    response.command.confidence >= 0.8
                      ? 'text-green-600 border-green-600'
                      : response.command.confidence >= 0.6
                        ? 'text-yellow-600 border-yellow-600'
                        : 'text-red-600 border-red-600'
                  }
                >
                  {Math.round(response.command.confidence * 100)}%
                </Badge>
              </div>
              {Object.keys(response.command.parameters).length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Parameters:</span>
                  <div className="bg-background p-2 rounded border">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(response.command.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Details */}
        {response.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error Details:</strong> {response.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {response.suggestions && response.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Suggestions:</span>
            </h4>
            <div className="space-y-2">
              {response.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-blue-800">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Actions */}
        {response.success && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Command processed successfully</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Changes</span>
            </Button>
          </div>
        )}

        {/* Failure Actions */}
        {!response.success && onRetry && (
          <div className="flex items-center justify-end pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
