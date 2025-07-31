'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { usePathname } from 'next/navigation';
import { MainNavigation } from '@/components/navigation/main-navigation';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Auth pages that don't need the dashboard layout
  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/signup');

  // If it's an auth page or user is not authenticated, show simple layout
  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  // Show dashboard layout for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto py-6">{children}</main>
    </div>
  );
}
