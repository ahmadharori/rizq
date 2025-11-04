/**
 * ErrorState Component
 * Display error state with retry button and user-friendly message
 */

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Maaf, terjadi kesalahan saat memuat data. Silakan coba lagi.',
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
