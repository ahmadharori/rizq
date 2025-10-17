import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Inbox } from 'lucide-react';
import type { Recipient } from '@/types/recipient';
import { DraggableRecipientCard } from './DraggableRecipientCard';
import { cn } from '@/utils/cn';

interface UnassignedColumnProps {
  recipients: Recipient[];
}

export const UnassignedColumn = ({ recipients }: UnassignedColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-gray-50 rounded-lg border-2 border-dashed transition-colors h-full min-h-[500px]',
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Belum Dikelompokkan</h3>
            <p className="text-xs text-gray-600 mt-0.5">{recipients.length} penerima</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[600px]">
        <SortableContext items={recipients.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {recipients.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Inbox className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Tidak ada penerima</p>
              <p className="text-xs mt-1">Semua sudah dikelompokkan</p>
            </div>
          ) : (
            recipients.map(recipient => (
              <DraggableRecipientCard key={recipient.id} recipient={recipient} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
