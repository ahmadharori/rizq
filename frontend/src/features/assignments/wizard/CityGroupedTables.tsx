import type { Recipient } from '@/types/recipient';
import type { CityGroup } from '@/utils/wizardConstants';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';

interface CityGroupedTablesProps {
  cityGroups: CityGroup[];
  selectedIds: string[];
  hoveredId: string | null;
  onToggleRecipient: (id: string) => void;
  onRowHover: (id: string | null) => void;
  isLoading?: boolean;
}

export const CityGroupedTables = ({
  cityGroups,
  selectedIds,
  hoveredId,
  onToggleRecipient,
  onRowHover,
  isLoading = false
}: CityGroupedTablesProps) => {
  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Memuat data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (cityGroups.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-8 text-center text-gray-500">
          Tidak ada penerima yang tersedia untuk assignment
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cityGroups.map((group) => {
        const allSelected = group.recipients.every(r => selectedIds.includes(r.id));
        const someSelected = group.recipients.some(r => selectedIds.includes(r.id)) && !allSelected;

        const handleSelectAllInGroup = () => {
          if (allSelected) {
            // Deselect all in this group
            group.recipients.forEach(r => {
              if (selectedIds.includes(r.id)) {
                onToggleRecipient(r.id);
              }
            });
          } else {
            // Select all in this group
            group.recipients.forEach(r => {
              if (!selectedIds.includes(r.id)) {
                onToggleRecipient(r.id);
              }
            });
          }
        };

        return (
          <div key={group.cityId} className="border rounded-lg overflow-hidden">
            {/* Header with city color */}
            <div
              className="px-4 py-3 text-white font-semibold"
              style={{ backgroundColor: group.color }}
            >
              <div className="flex items-center justify-between">
                <span>{group.cityName}</span>
                <span className="text-sm opacity-90">
                  {group.recipients.length} penerima
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAllInGroup}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Nomor Telpon
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Alamat
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Paket
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.recipients.map((recipient: Recipient, localIndex: number) => {
                  const isSelected = selectedIds.includes(recipient.id);
                  const isHovered = hoveredId === recipient.id;

                  return (
                    <tr
                      key={recipient.id}
                      id={`recipient-row-${recipient.id}`}
                      className={cn(
                        'transition-colors cursor-pointer',
                        isHovered && 'bg-blue-50',
                        isSelected && 'bg-blue-50'
                      )}
                      onMouseEnter={() => onRowHover(recipient.id)}
                      onMouseLeave={() => onRowHover(null)}
                      onClick={() => onToggleRecipient(recipient.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleRecipient(recipient.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {localIndex + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {recipient.name}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={recipient.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {recipient.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {recipient.address}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {recipient.num_packages}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
