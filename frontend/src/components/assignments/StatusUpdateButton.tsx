/**
 * StatusUpdateButton Component
 * Dropdown button for updating recipient status with validation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';
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

interface StatusUpdateButtonProps {
  assignmentId: string;
  recipientId: string;
  recipientName: string;
  currentStatus: RecipientStatus;
  onStatusUpdated?: () => void;
}

export function StatusUpdateButton({
  assignmentId,
  recipientId,
  recipientName,
  currentStatus,
  onStatusUpdated
}: StatusUpdateButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RecipientStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  // Get allowed status transitions for current status
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

  // Handle status selection
  const handleStatusSelect = (status: RecipientStatus) => {
    setSelectedStatus(status);
    setConfirmOpen(true);
  };

  // Handle status update
  const handleConfirmUpdate = async () => {
    if (!selectedStatus) return;

    setUpdating(true);
    try {
      await assignmentService.updateRecipientStatus(
        assignmentId,
        recipientId,
        selectedStatus
      );

      toast.success(`Status ${recipientName} berhasil diubah ke ${STATUS_LABELS[selectedStatus]}`);
      setConfirmOpen(false);
      setSelectedStatus(null);
      
      // Notify parent component
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah status');
    } finally {
      setUpdating(false);
    }
  };

  // If no allowed transitions, show disabled state
  if (allowedStatuses.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        {STATUS_LABELS[currentStatus]}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {STATUS_LABELS[currentStatus]}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allowedStatuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusSelect(status)}
            >
              Ubah ke: {STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan Status</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengubah status penerima <strong>{recipientName}</strong> dari{' '}
              <strong>{STATUS_LABELS[currentStatus]}</strong> ke{' '}
              <strong>{selectedStatus ? STATUS_LABELS[selectedStatus] : ''}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={updating}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={updating}
            >
              {updating ? 'Mengubah...' : 'Ya, Ubah Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
