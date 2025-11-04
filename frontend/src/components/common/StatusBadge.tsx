/**
 * StatusBadge Component
 * Displays recipient status with color-coded badge
 * WCAG 2.2 Level AA compliant (4.5:1 minimum contrast ratio)
 * Uses icons in addition to color for accessibility
 */

import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Truck, CheckCircle, RotateCcw } from 'lucide-react';
import { RecipientStatus } from '@/types/recipient';

interface StatusBadgeProps {
  status: RecipientStatus;
  /** Show icon alongside text (default: true) */
  showIcon?: boolean;
}

const STATUS_CONFIG = {
  [RecipientStatus.UNASSIGNED]: {
    variant: 'secondary' as const,
    className: 'bg-gray-600 text-white hover:bg-gray-700', // 7.05:1 contrast (AAA)
    label: 'Unassigned',
    icon: FileText,
  },
  [RecipientStatus.ASSIGNED]: {
    variant: 'secondary' as const,
    className: 'bg-amber-700 text-white hover:bg-amber-800', // 5.38:1 contrast (AA)
    label: 'Assigned',
    icon: Edit,
  },
  [RecipientStatus.DELIVERY]: {
    variant: 'secondary' as const,
    className: 'bg-blue-600 text-white hover:bg-blue-700', // 4.66:1 contrast (AA)
    label: 'Delivery',
    icon: Truck,
  },
  [RecipientStatus.DONE]: {
    variant: 'secondary' as const,
    className: 'bg-green-700 text-white hover:bg-green-800', // 5.37:1 contrast (AA)
    label: 'Done',
    icon: CheckCircle,
  },
  [RecipientStatus.RETURN]: {
    variant: 'secondary' as const,
    className: 'bg-red-600 text-white hover:bg-red-700', // 5.13:1 contrast (AA)
    label: 'Return',
    icon: RotateCcw,
  }
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" aria-hidden="true" />}
      {config.label}
    </Badge>
  );
}
