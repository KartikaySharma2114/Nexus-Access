'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  message: string;
  error?: string;
  executionTime?: number;
}

interface CommandHistoryProps {
  history: CommandHistoryItem[];
  onRetry: (command: string) => Promise<void>;
  onClear: () => void;
  maxItems?: number;
}

export function CommandHistory({
  history,
  onRetry,
  onClear,
  maxItems = 50,
}: CommandHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const displayHistory = history.slice(0, maxItems);
  const successCount = displayHistory.filter((item) => item.success).length;
  const failureCount = displayHistory.length - successCount;

  const handleRetry = async (item: CommandHistoryItem) => {
    await onRetry(item.command);
  };

  const toggleItemDetails = (itemId: string) => {
    setSelectedItem(selectedItem === itemId ? null : itemId);
  };

  if (displayHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Command History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No commands executed yet</p>
            <p className="text-sm">Your command history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Command History</span>
            <Badge variant="secondary" className="ml-2">
              {displayHistory.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{successCount}</span>
              <XCircle className="h-4 w-4 text-red-500 ml-2" />
              <span>{failureCount}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={displayHistory.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-3">
              {displayHistory.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    item.success
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {item.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(item.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                        {item.executionTime && (
                          <Badge variant="outline" className="text-xs">
                            {item.executionTime}ms
                          </Badge>
                        )}
                      </div>

                      <div className="font-mono text-sm bg-background/50 rounded p-2 mb-2">
                        {item.command}
                      </div>

                      <div className="text-sm">
                        <span
                          className={
                            item.success ? 'text-green-700' : 'text-red-700'
                          }
                        >
                          {item.message}
                        </span>
                      </div>

                      {item.error && selectedItem === item.id && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                          <strong>Error:</strong> {item.error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {item.error && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleItemDetails(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          {selectedItem === item.id ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(item)}
                        className="h-8 w-8 p-0"
                        title="Retry command"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {history.length > maxItems && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing {maxItems} of {history.length} commands
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
