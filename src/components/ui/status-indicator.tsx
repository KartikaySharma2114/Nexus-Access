'use client';

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'pending' | 'loading';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  message,
  size = 'md',
  showIcon = true,
  className,
}: StatusIndicatorProps) {
  const getIcon = () => {
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const iconSize = iconSizes[size];

    switch (status) {
      case 'success':
        return <CheckCircle className={cn(iconSize, 'text-green-600')} />;
      case 'error':
        return <XCircle className={cn(iconSize, 'text-red-600')} />;
      case 'warning':
        return <AlertCircle className={cn(iconSize, 'text-yellow-600')} />;
      case 'pending':
        return <Clock className={cn(iconSize, 'text-gray-600')} />;
      case 'loading':
        return (
          <Loader2 className={cn(iconSize, 'text-blue-600 animate-spin')} />
        );
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'pending':
        return 'text-gray-700';
      case 'loading':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 px-3 py-2 rounded-md border',
        getBgColor(),
        className
      )}
    >
      {showIcon && getIcon()}
      {message && (
        <span className={cn(textSizes[size], getTextColor())}>{message}</span>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  text?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, text, size = 'sm' }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        getVariant(),
        sizeClasses[size]
      )}
    >
      {text || status}
    </span>
  );
}
