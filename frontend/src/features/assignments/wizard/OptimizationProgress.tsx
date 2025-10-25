import { Loader2 } from 'lucide-react';

interface OptimizationProgressProps {
  message: string;
}

export default function OptimizationProgress({ message }: OptimizationProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Mengoptimalkan Rute</h3>
        <p className="text-sm text-gray-500 mt-1">{message || 'Harap tunggu...'}</p>
      </div>
      <div className="text-xs text-gray-400 max-w-md text-center">
        Algoritma optimasi sedang berjalan. Proses ini dapat memakan waktu hingga 60 detik untuk dataset besar.
      </div>
    </div>
  );
}
