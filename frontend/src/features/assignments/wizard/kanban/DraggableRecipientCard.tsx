import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Package } from 'lucide-react';
import type { Recipient } from '@/types/recipient';
import { cn } from '@/utils/cn';

interface DraggableRecipientCardProps {
  recipient: Recipient;
  isDragging?: boolean;
}

export const DraggableRecipientCard = ({
  recipient,
  isDragging = false,
}: DraggableRecipientCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: recipient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg p-3 mb-2 cursor-move transition-all',
        'hover:shadow-md hover:border-blue-300',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg',
        isDragging && 'rotate-2'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">{recipient.name}</div>
          <div className="text-xs text-gray-600 truncate mt-0.5">{recipient.phone}</div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{recipient.address}</div>
          <div className="flex items-center gap-1 mt-1.5">
            <Package className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">
              {recipient.num_packages} paket
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
