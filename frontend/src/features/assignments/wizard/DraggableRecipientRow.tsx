import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Recipient } from '@/types/recipient';

interface DraggableRecipientRowProps {
  recipient: Recipient;
  index: number;
  onRemove: () => void;
}

export default function DraggableRecipientRow({ recipient, index, onRemove }: DraggableRecipientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: recipient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-3 bg-white border rounded-lg
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:bg-gray-50'}
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Index Number */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
        {index + 1}
      </div>

      {/* Recipient Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{recipient.name}</div>
        <div className="text-sm text-gray-500 truncate">{recipient.address}</div>
      </div>

      {/* Package Count */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Package className="h-4 w-4" />
        <span>{recipient.num_packages}</span>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
