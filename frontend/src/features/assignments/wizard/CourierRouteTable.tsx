import { useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { PreviewAssignment } from '@/types/wizard';
import type { Recipient } from '@/types/recipient';
import type { Courier } from '@/types/courier';
import optimizationService from '@/services/optimizationService';
import DraggableRecipientRow from './DraggableRecipientRow';

interface CourierRouteTableProps {
  assignment: PreviewAssignment;
  courier?: Courier;
  recipients: Recipient[];
  recipientOrder: string[];
  totalPackages: number;
  capacity: number | null;
  color: string;
  onReorder: (recipientIds: string[]) => void;
  onRemove: (recipientId: string) => void;
}

export default function CourierRouteTable({
  assignment,
  courier,
  recipients,
  recipientOrder,
  totalPackages,
  capacity,
  color,
  onReorder,
  onRemove,
}: CourierRouteTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Sort recipients by the order in recipientOrder
  const sortedRecipients = useMemo(() => {
    return recipientOrder
      .map(id => recipients.find(r => r.id === id))
      .filter((r): r is Recipient => r !== undefined);
  }, [recipientOrder, recipients]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = recipientOrder.indexOf(active.id as string);
    const newIndex = recipientOrder.indexOf(over.id as string);

    const newOrder = arrayMove(recipientOrder, oldIndex, newIndex);
    onReorder(newOrder);
  };

  // Check if capacity is exceeded
  const isOverCapacity = capacity !== null && totalPackages > capacity;

  // Show warning toast when over capacity
  const handleCapacityWarning = () => {
    if (isOverCapacity) {
      toast.warning(`⚠️ ${courier?.name || 'Pengantar'} melebihi kapasitas (${totalPackages}/${capacity} paket)`);
    }
  };

  return (
    <Card className="shadow-sm" style={{ borderLeftColor: color, borderLeftWidth: '4px' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <CardTitle className="text-lg">
              {courier?.name || 'Belum Assign Pengantar'}
            </CardTitle>
          </div>
          
          {/* Capacity Badge */}
          <Badge
            variant={isOverCapacity ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
            onMouseEnter={handleCapacityWarning}
          >
            <Package className="h-3 w-3" />
            {totalPackages}
            {capacity !== null && ` / ${capacity}`}
            {isOverCapacity && <AlertTriangle className="h-3 w-3 ml-1" />}
          </Badge>
        </div>

        {/* Route Summary */}
        {assignment.routeData && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{optimizationService.formatDistance(assignment.routeData.totalDistanceMeters)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{optimizationService.formatDuration(assignment.routeData.totalDurationSeconds)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{sortedRecipients.length} stops</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={recipientOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedRecipients.map((recipient, index) => (
                <DraggableRecipientRow
                  key={recipient.id}
                  recipient={recipient}
                  index={index}
                  onRemove={() => onRemove(recipient.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {sortedRecipients.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Tidak ada penerima di rute ini
          </div>
        )}
      </CardContent>
    </Card>
  );
}
