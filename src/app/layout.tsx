import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { ConditionalLayout } from '@/components/common/conditional-layout';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RBAC Configuration Tool',
  description: 'Role-Based Access Control management system for administrators',
};

// Global error handler for unhandled errors
function handleGlobalError(error: Error, errorInfo: React.ErrorInfo) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Global error caught:', error, errorInfo);
  }

  // In production, you might want to send to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, {
    //   extra: errorInfo,
    //   tags: { level: 'global' }
    // });
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary level="global" onError={handleGlobalError}>
          <AuthProvider>
            <ErrorBoundary level="section">
              <ConditionalLayout>{children}</ConditionalLayout>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
