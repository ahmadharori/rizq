import { Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { STATUS_COLORS, groupRecipientsByCity } from '@/utils/wizardConstants';
import type { Recipient } from '@/types/recipient';

interface MapLegendProps {
  viewMode?: 'all' | 'city';
  recipients?: Recipient[];
}

export const MapLegend = ({ viewMode = 'all', recipients = [] }: MapLegendProps) => {
  // Status legends for 'all' mode
  const statusLegends = [
    { key: 'Unassigned', label: 'Belum Ditugaskan', color: STATUS_COLORS.Unassigned },
    { key: 'Assigned', label: 'Sudah Ditugaskan', color: STATUS_COLORS.Assigned },
    { key: 'Delivery', label: 'Dalam Pengantaran', color: STATUS_COLORS.Delivery },
    { key: 'Done', label: 'Selesai', color: STATUS_COLORS.Done },
    { key: 'Return', label: 'Dikembalikan', color: STATUS_COLORS.Return },
  ];

  // City legends for 'city' mode
  const cityGroups = viewMode === 'city' ? groupRecipientsByCity(recipients) : [];

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">
        Legenda Peta
      </div>
      <div className="space-y-2 max-h-[450px] overflow-y-auto">
        {viewMode === 'all' ? (
          // Render status legends
          statusLegends.map((legend) => (
            <div key={legend.key} className="flex items-center gap-2">
              <Circle
                className="w-4 h-4 flex-shrink-0"
                fill={legend.color}
                stroke={legend.color}
                strokeWidth={0}
              />
              <span className="text-sm text-gray-600">{legend.label}</span>
            </div>
          ))
        ) : (
          // Render city legends
          cityGroups.map((group) => (
            <div key={group.cityId} className="flex items-center gap-2">
              <Circle
                className="w-4 h-4 flex-shrink-0"
                fill={group.color}
                stroke={group.color}
                strokeWidth={0}
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium">{group.cityName}</span>
                <span className="text-xs text-gray-500">{group.recipients.length} penerima</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
