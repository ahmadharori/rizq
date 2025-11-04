/**
 * StatusHistoryModal Component
 * Display status change history timeline for a recipient
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { assignmentService } from '@/services/assignmentService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RecipientStatus } from '@/types/recipient';

interface StatusHistoryModalProps {
  assignmentId: string;
  recipientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StatusHistoryItem {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by_username: string;
  changed_at: string;
}

export function StatusHistoryModal({
  assignmentId,
  recipientId,
  open,
  onOpenChange
}: StatusHistoryModalProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && assignmentId && recipientId) {
      loadHistory();
    }
  }, [open, assignmentId, recipientId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getRecipientStatusHistory(
        assignmentId,
        recipientId
      );
      setHistory(data.history);
      setRecipientName(data.recipient_name);
    } catch (error: any) {
      console.error('Failed to load status history:', error);
      toast.error('Gagal memuat riwayat status');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Riwayat Status - {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Memuat riwayat status...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada riwayat status
            </div>
          ) : (
            <div className="space-y-0">
              {/* Timeline */}
              {history.map((item, index) => (
                <div key={item.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    {index < history.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ minHeight: '40px' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {/* Status Transition */}
                      <div className="flex items-center gap-2 font-medium">
                        {item.old_status ? (
                          <>
                            <StatusBadge status={item.old_status as RecipientStatus} />
                            <span className="text-gray-400">→</span>
                            <StatusBadge status={item.new_status as RecipientStatus} />
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">Status Awal:</span>
                            <StatusBadge status={item.new_status as RecipientStatus} />
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-sm text-gray-500">
                        {formatDate(item.changed_at)}
                      </div>

                      {/* Changed By (if available) */}
                      {item.changed_by_username && (
                        <div className="text-xs text-gray-400">
                          Diubah oleh: {item.changed_by_username}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
