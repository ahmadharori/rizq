import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, Users, Package, Edit2, Check, X } from 'lucide-react';
import type { ManualGroup } from '@/types/wizard';
import type { Recipient } from '@/types/recipient';
import type { CourierListItem } from '@/types/courier';
import { DraggableRecipientCard } from './DraggableRecipientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';

interface GroupColumnProps {
  group: ManualGroup;
  recipients: Recipient[];
  couriers: CourierListItem[];
  onUpdateGroup: (groupId: string, updates: Partial<ManualGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const GroupColumn = ({
  group,
  recipients,
  couriers,
  onUpdateGroup,
  onDeleteGroup,
}: GroupColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const totalPackages = recipients.reduce((sum, r) => sum + r.num_packages, 0);

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateGroup(group.id, { name: editName.trim() });
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(group.name);
    setIsEditingName(false);
  };

  const handleCourierChange = (courierId: string) => {
    onUpdateGroup(group.id, { courierId });
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-white rounded-lg border-2 transition-colors h-full min-h-[500px]',
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-50 rounded-t-lg">
        {/* Group Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2 mb-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleSaveName}
            >
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleCancelEdit}
            >
              <X className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => onDeleteGroup(group.id)}
              title="Hapus Kelompok"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        )}

        {/* Courier Selection */}
        <div className="mb-3">
          <Select
            value={group.courierId || ''}
            onValueChange={handleCourierChange}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Pilih pengantar..." />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((courier) => (
                <SelectItem key={courier.id} value={courier.id}>
                  {courier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{recipients.length} penerima</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{totalPackages} paket</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[600px]">
        <SortableContext items={recipients.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {recipients.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Belum ada penerima</p>
              <p className="text-xs mt-1">Drag penerima ke sini</p>
            </div>
          ) : (
            recipients.map((recipient) => (
              <DraggableRecipientCard key={recipient.id} recipient={recipient} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
