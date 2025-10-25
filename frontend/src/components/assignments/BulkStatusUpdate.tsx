/**
 * BulkStatusUpdate Component
 * Dialog for bulk updating recipient status with validation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { assignmentService } from '@/services/assignmentService';
import type { RecipientStatus } from '@/types/recipient';

// Status transition rules (must match backend)
const ALLOWED_TRANSITIONS: Record<RecipientStatus, RecipientStatus[]> = {
  'Unassigned': ['Assigned'],
  'Assigned': ['Delivery', 'Return'],
  'Delivery': ['Done', 'Return'],
  'Done': [],
  'Return': ['Assigned']
};

// Status labels in Indonesian
const STATUS_LABELS: Record<RecipientStatus, string> = {
  'Unassigned': 'Belum Ditugaskan',
  'Assigned': 'Ditugaskan',
  'Delivery': 'Dalam Pengiriman',
  'Done': 'Selesai',
  'Return': 'Dikembalikan'
};

interface BulkStatusUpdateProps {
  assignmentId: string;
  selectedRecipients: Array<{
    id: string;
    name: string;
    status: RecipientStatus;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
}

export function BulkStatusUpdate({
  assignmentId,
  selectedRecipients,
  open,
  onOpenChange,
  onStatusUpdated
}: BulkStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<RecipientStatus | ''>('');
  const [updating, setUpdating] = useState(false);

  // Get common allowed statuses across all selected recipients
  const getCommonAllowedStatuses = (): RecipientStatus[] => {
    if (selectedRecipients.length === 0) return [];

    // Get allowed statuses for first recipient
    const firstAllowed = ALLOWED_TRANSITIONS[selectedRecipients[0].status] || [];
    
    // Find intersection with all other recipients
    return firstAllowed.filter(status => 
      selectedRecipients.every(r => {
        const allowed = ALLOWED_TRANSITIONS[r.status] || [];
        return allowed.includes(status);
      })
    );
  };

  const commonAllowedStatuses = getCommonAllowedStatuses();

  // Get validation details
  const getValidationDetails = (status: RecipientStatus) => {
    const valid = selectedRecipients.filter(r => {
      const allowed = ALLOWED_TRANSITIONS[r.status] || [];
      return allowed.includes(status);
    });
    
    const invalid = selectedRecipients.filter(r => {
      const allowed = ALLOWED_TRANSITIONS[r.status] || [];
      return !allowed.includes(status);
    });

    return { valid, invalid };
  };

  // Handle status update
  const handleUpdate = async () => {
    if (!selectedStatus) return;

    const { invalid } = getValidationDetails(selectedStatus);

    if (invalid.length > 0) {
      toast.error(`${invalid.length} penerima tidak dapat diubah ke status ${STATUS_LABELS[selectedStatus]}`);
      return;
    }

    setUpdating(true);
    try {
      const recipientIds = selectedRecipients.map(r => r.id);
      const result = await assignmentService.bulkUpdateRecipientStatus(
        assignmentId,
        recipientIds,
        selectedStatus
      );

      if (result.success_count > 0) {
        toast.success(`Berhasil mengubah status ${result.success_count} penerima ke ${STATUS_LABELS[selectedStatus]}`);
      }

      if (result.failed_count > 0) {
        toast.warning(`${result.failed_count} penerima gagal diubah. Lihat detail di console.`);
        console.log('Failed recipients:', result.failed_details);
      }

      onOpenChange(false);
      setSelectedStatus('');
      
      // Notify parent component
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error: any) {
      console.error('Failed to bulk update status:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Status Massal</DialogTitle>
          <DialogDescription>
            Ubah status untuk {selectedRecipients.length} penerima yang dipilih
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Status Baru</label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as RecipientStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status..." />
              </SelectTrigger>
              <SelectContent>
                {commonAllowedStatuses.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    Tidak ada status yang dapat diterapkan ke semua penerima yang dipilih
                  </div>
                ) : (
                  commonAllowedStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Validation Preview */}
          {selectedStatus && (
            <div className="p-3 bg-gray-50 rounded-md space-y-2 text-sm">
              <div className="font-medium">Preview:</div>
              {(() => {
                const { valid, invalid } = getValidationDetails(selectedStatus);
                return (
                  <>
                    <div className="text-green-600">
                      ✓ {valid.length} penerima akan diubah
                    </div>
                    {invalid.length > 0 && (
                      <div className="text-red-600">
                        ✗ {invalid.length} penerima tidak dapat diubah (status tidak valid)
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Selected Recipients List */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Penerima yang Dipilih:</div>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {selectedRecipients.map(r => (
                <div key={r.id} className="text-sm flex justify-between items-center">
                  <span>{r.name}</span>
                  <span className="text-xs text-gray-500">{STATUS_LABELS[r.status]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating || !selectedStatus || commonAllowedStatuses.length === 0}
          >
            {updating ? 'Mengubah...' : 'Ubah Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
