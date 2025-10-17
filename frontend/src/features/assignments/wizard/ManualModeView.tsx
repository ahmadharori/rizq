import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { WizardState, ManualGroup } from '@/types/wizard';
import type { CourierListItem } from '@/types/courier';
import type { Recipient } from '@/types/recipient';
import { UnassignedColumn } from './kanban/UnassignedColumn';
import { GroupColumn } from './kanban/GroupColumn';
import { DraggableRecipientCard } from './kanban/DraggableRecipientCard';
import { Button } from '@/components/ui/button';

interface ManualModeViewProps {
  state: WizardState;
  actions: ReturnType<typeof import('@/hooks/useWizardState')['useWizardState']>['actions'];
  couriers: CourierListItem[];
}

export const ManualModeView = ({ state, actions, couriers }: ManualModeViewProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get unassigned recipients
  const unassignedRecipientIds = useMemo(() => {
    const assignedIds = new Set<string>();
    state.manualGroups.forEach(group => {
      group.recipientIds.forEach(id => assignedIds.add(id));
    });
    return state.selectedRecipientIds.filter(id => !assignedIds.has(id));
  }, [state.selectedRecipientIds, state.manualGroups]);

  const unassignedRecipients = useMemo(() => {
    return state.recipients.filter(r => unassignedRecipientIds.includes(r.id));
  }, [state.recipients, unassignedRecipientIds]);

  // Get active recipient being dragged
  const activeRecipient = useMemo(() => {
    if (!activeId) return null;
    return state.recipients.find(r => r.id === activeId);
  }, [activeId, state.recipients]);

  // Handle adding new group
  const handleAddGroup = () => {
    const newGroup: ManualGroup = {
      id: `group-${Date.now()}`,
      name: `Kelompok ${state.manualGroups.length + 1}`,
      recipientIds: [],
    };
    actions.addManualGroup(newGroup);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeRecipientId = active.id as string;
    const overId = over.id as string;

    // Find source group (or unassigned)
    let sourceGroupId: string | null = null;
    if (overId === 'unassigned') {
      sourceGroupId = null;
    } else if (overId.startsWith('group-')) {
      sourceGroupId = overId;
    } else {
      // Dropped on another recipient - find its parent group
      const parentGroup = state.manualGroups.find(g => g.recipientIds.includes(overId));
      sourceGroupId = parentGroup?.id || null;
    }

    // Find current location of the active recipient
    let currentGroupId: string | null = null;
    const currentGroup = state.manualGroups.find(g => g.recipientIds.includes(activeRecipientId));
    currentGroupId = currentGroup?.id || null;

    // If dropped in the same location, do nothing
    if (currentGroupId === sourceGroupId) {
      setActiveId(null);
      return;
    }

    // Remove from current group
    if (currentGroup) {
      actions.updateManualGroup(currentGroup.id, {
        recipientIds: currentGroup.recipientIds.filter(id => id !== activeRecipientId),
      });
    }

    // Add to target group
    if (sourceGroupId) {
      const targetGroup = state.manualGroups.find(g => g.id === sourceGroupId);
      if (targetGroup) {
        actions.updateManualGroup(targetGroup.id, {
          recipientIds: [...targetGroup.recipientIds, activeRecipientId],
        });
      }
    }

    setActiveId(null);
  };

  // Calculate column width
  const numColumns = state.manualGroups.length + 1; // +1 for unassigned
  const columnWidth = `${100 / numColumns}%`;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Unassigned Column */}
          <div style={{ minWidth: '280px', width: columnWidth }}>
            <UnassignedColumn recipients={unassignedRecipients} />
          </div>

          {/* Group Columns */}
          {state.manualGroups.map(group => {
            const groupRecipients = state.recipients.filter(r =>
              group.recipientIds.includes(r.id)
            );
            return (
              <div key={group.id} style={{ minWidth: '280px', width: columnWidth }}>
                <GroupColumn
                  group={group}
                  recipients={groupRecipients}
                  couriers={couriers}
                  onUpdateGroup={actions.updateManualGroup}
                  onDeleteGroup={actions.removeManualGroup}
                />
              </div>
            );
          })}

          {/* Add Group Button */}
          <div style={{ minWidth: '60px' }} className="flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddGroup}
              className="w-12 h-12 rounded-full"
              title="Tambah Kelompok"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-600">Belum dikelompokkan:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {unassignedRecipientIds.length}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Kelompok:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {state.manualGroups.length}
              </span>
            </div>
          </div>
          {unassignedRecipientIds.length > 0 && (
            <div className="text-sm text-orange-600">
              Semua penerima harus dimasukkan ke dalam kelompok
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeRecipient ? (
          <div className="rotate-2 opacity-80">
            <DraggableRecipientCard recipient={activeRecipient} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
