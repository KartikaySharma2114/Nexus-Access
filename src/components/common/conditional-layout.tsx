'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Auth pages that don't need the dashboard layout
  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/signup');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If it's an auth page or user is not authenticated, show simple layout
  if (isAuthPage || !user) {
    return <>{children}</>;
  }

  // Show dashboard layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/">
                <h1 className="text-xl font-semibold text-gray-900 hover:text-gray-700 cursor-pointer">
                  RBAC Configuration Tool
                </h1>
              </Link>
              <nav className="flex space-x-6">
                <Link
                  href="/permissions"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/permissions'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Permissions
                </Link>
                <Link
                  href="/roles"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/roles'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Roles
                </Link>
                <Link
                  href="/associations"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/associations'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Associations
                </Link>
                <Link
                  href="/natural-language"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/natural-language'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Natural Language
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
