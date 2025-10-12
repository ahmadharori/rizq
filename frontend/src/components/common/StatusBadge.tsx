/**
 * StatusBadge Component
 * Displays recipient status with color-coded badge
 */

import { Badge } from '@/components/ui/badge';
import { RecipientStatus } from '@/types/recipient';

interface StatusBadgeProps {
  status: RecipientStatus;
}

const STATUS_CONFIG = {
  [RecipientStatus.UNASSIGNED]: {
    variant: 'secondary' as const,
    className: 'bg-gray-500 text-white hover:bg-gray-600',
    label: 'Unassigned'
  },
  [RecipientStatus.ASSIGNED]: {
    variant: 'secondary' as const,
    className: 'bg-amber-500 text-white hover:bg-amber-600',
    label: 'Assigned'
  },
  [RecipientStatus.DELIVERY]: {
    variant: 'secondary' as const,
    className: 'bg-blue-500 text-white hover:bg-blue-600',
    label: 'Delivery'
  },
  [RecipientStatus.DONE]: {
    variant: 'secondary' as const,
    className: 'bg-green-500 text-white hover:bg-green-600',
    label: 'Done'
  },
  [RecipientStatus.RETURN]: {
    variant: 'secondary' as const,
    className: 'bg-red-500 text-white hover:bg-red-600',
    label: 'Return'
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
