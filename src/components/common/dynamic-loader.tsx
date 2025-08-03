import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';
import { LoadingSpinner } from './loading-spinner';

// Generic loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner size="lg" />
  </div>
);

// Error component for failed dynamic imports
const ErrorComponent = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center min-h-[200px] text-center">
    <div className="text-red-600">
      <h3 className="text-lg font-semibold mb-2">Failed to load component</h3>
      <p className="text-sm text-gray-600">{error.message}</p>
    </div>
  </div>
);

// Higher-order function to create dynamically loaded components
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: () => ReactElement;
    error?: ComponentType<{ error: Error }>;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingComponent,
    ssr: false, // Disable SSR for dynamic components to improve initial load
  });
}

// Pre-configured dynamic loaders for common component types
export const DynamicComponents = {
  // Dashboard components
  DashboardStats: createDynamicComponent(
    () => import('@/components/dashboard/dashboard-stats')
  ),
};