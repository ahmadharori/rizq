/**
 * useOfflineDetection Hook
 * Detect network status and notify user when offline
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      toast.success('Koneksi internet kembali', {
        description: 'Anda kembali online',
      });
    }

    function handleOffline() {
      setIsOnline(false);
      toast.error('Tidak ada koneksi internet', {
        description: 'Beberapa fitur mungkin tidak tersedia',
        duration: Infinity, // Don't auto-dismiss
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
