'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  onClear,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value, debounceMs]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showResults?: boolean;
  resultCount?: number;
  isSearching?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  showResults = false,
  resultCount = 0,
  isSearching = false,
}: SearchBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        debounceMs={debounceMs}
      />

      {showResults && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            {isSearching ? (
              <span>Searching...</span>
            ) : value ? (
              <span>
                {resultCount} result{resultCount !== 1 ? 's' : ''} for &quot;
                {value}&quot;
              </span>
            ) : (
              <span>Enter a search term to filter results</span>
            )}
          </div>

          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="text-xs"
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
