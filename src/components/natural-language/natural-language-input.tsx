'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Lightbulb, HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NaturalLanguageInputProps {
  onSubmit: (command: string) => Promise<void>;
  isLoading: boolean;
  suggestions: string[];
  helpText: string;
}

export function NaturalLanguageInput({
  onSubmit,
  isLoading,
  suggestions,
  helpText,
}: NaturalLanguageInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    setInput('');
    await onSubmit(command);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your command in plain English... (e.g., 'Create a new permission called read_users')"
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-10 w-10 p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send command</span>
              </Button>

              <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span className="sr-only">Show suggestions</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Command Suggestions</h4>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Show help</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Command Help</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {helpText}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick action badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() =>
                handleSuggestionClick('Create a new permission called ')
              }
            >
              Create Permission
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleSuggestionClick('Create a new role called ')}
            >
              Create Role
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() =>
                handleSuggestionClick('Give the  role the  permission')
              }
            >
              Assign Permission
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() =>
                handleSuggestionClick('Remove  permission from  role')
              }
            >
              Remove Permission
            </Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
