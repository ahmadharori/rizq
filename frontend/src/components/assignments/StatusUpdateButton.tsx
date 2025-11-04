/**
 * StatusUpdateButton Component
 * Dropdown button for updating recipient status with validation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ChevronDown, FileText, Edit, Truck, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { assignmentService } from '@/services/assignmentService';
import type { RecipientStatus } from '@/types/recipient';
import type { LucideIcon } from 'lucide-react';

// Status transition rules (must match backend)
const ALLOWED_TRANSITIONS: Record<RecipientStatus, RecipientStatus[]> = {
  'Unassigned': ['Assigned'],
  'Assigned': ['Delivery', 'Return'],
  'Delivery': ['Done', 'Return'],
  'Done': [],
  'Return': ['Assigned']
};

// Status configuration with WCAG AA compliant colors + icons (matching StatusBadge.tsx)
const STATUS_CONFIG: Record<RecipientStatus, { className: string; label: string; icon: LucideIcon }> = {
  'Unassigned': {
    className: 'bg-gray-600 text-white hover:bg-gray-700',
    label: 'Unassigned',
    icon: FileText
  },
  'Assigned': {
    className: 'bg-amber-700 text-white hover:bg-amber-800',
    label: 'Assigned',
    icon: Edit
  },
  'Delivery': {
    className: 'bg-blue-600 text-white hover:bg-blue-700',
    label: 'Delivery',
    icon: Truck
  },
  'Done': {
    className: 'bg-green-700 text-white hover:bg-green-800',
    label: 'Done',
    icon: CheckCircle
  },
  'Return': {
    className: 'bg-red-600 text-white hover:bg-red-700',
    label: 'Return',
    icon: RotateCcw
  }
};

// Status labels in Indonesian for confirmation dialog
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

  const config = STATUS_CONFIG[currentStatus];
  const StatusIcon = config.icon;

  // If no allowed transitions, show disabled state
  if (allowedStatuses.length === 0) {
    return (
      <Badge className={`${config.className} opacity-60 cursor-not-allowed flex items-center gap-1.5`}>
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge 
            className={`${config.className} cursor-pointer transition-all flex items-center gap-1.5`}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          {allowedStatuses.map((status) => {
            const StatusMenuIcon = STATUS_CONFIG[status].icon;
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusSelect(status)}
              >
                <Badge className={`${STATUS_CONFIG[status].className} flex items-center gap-1.5`}>
                  <StatusMenuIcon className="h-3 w-3" />
                  {STATUS_CONFIG[status].label}
                </Badge>
              </DropdownMenuItem>
            );
          })}
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
