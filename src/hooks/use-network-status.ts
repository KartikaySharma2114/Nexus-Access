/**
 * React hook for network status monitoring
 */

import { useState, useEffect } from 'react';
import { networkMonitor } from '@/lib/network-error-handler';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
}

/**
 * Hook to monitor network status changes
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: 'unknown',
      };
    }
    return networkMonitor.getStatus();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const unsubscribe = networkMonitor.addListener((isOnline) => {
      setStatus(networkMonitor.getStatus());
    });

    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook to wait for network connection
 */
export function useNetworkConnection() {
  const status = useNetworkStatus();

  const waitForConnection = async (
    timeout: number = 30000
  ): Promise<boolean> => {
    if (status.isOnline) {
      return true;
    }

    return networkMonitor.waitForConnection(timeout);
  };

  return {
    ...status,
    waitForConnection,
  };
}
