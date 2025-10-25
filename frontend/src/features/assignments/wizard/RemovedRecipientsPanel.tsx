import { useState } from 'react';
import { ChevronRight, ChevronLeft, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Recipient } from '@/types/recipient';
import type { PreviewAssignment } from '@/types/wizard';

interface RemovedRecipientsPanelProps {
  removedRecipientIds: string[];
  recipients: Recipient[];
  assignments: PreviewAssignment[];
  onAddToAssignment: (assignmentId: string, recipientId: string) => void;
}

export default function RemovedRecipientsPanel({
  removedRecipientIds,
  recipients,
  assignments,
  onAddToAssignment,
}: RemovedRecipientsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, string>>({});

  const removedRecipients = recipients.filter(r => removedRecipientIds.includes(r.id));

  if (removedRecipients.length === 0 && isCollapsed) {
    return null;
  }

  const handleAddRecipient = (recipientId: string) => {
    const assignmentId = selectedAssignments[recipientId];
    if (assignmentId) {
      onAddToAssignment(assignmentId, recipientId);
      // Clear selection after adding
      setSelectedAssignments(prev => {
        const newState = { ...prev };
        delete newState[recipientId];
        return newState;
      });
    }
  };

  return (
    <div className={`relative transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
      {/* Collapse/Expand Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 h-8 w-8 p-0 rounded-full shadow-md"
      >
        {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {!isCollapsed && (
        <Card className="shadow-sm h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Penerima Dihapus
              {removedRecipients.length > 0 && (
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {removedRecipients.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {removedRecipients.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Tidak ada penerima yang dihapus
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {removedRecipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
                  >
                    {/* Recipient Info */}
                    <div>
                      <div className="font-medium text-sm text-gray-900">{recipient.name}</div>
                      <div className="text-xs text-gray-500 truncate">{recipient.address}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {recipient.num_packages} paket
                      </div>
                    </div>

                    {/* Assignment Selector */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedAssignments[recipient.id] || ''}
                        onValueChange={(value) =>
                          setSelectedAssignments(prev => ({ ...prev, [recipient.id]: value }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih rute..." />
                        </SelectTrigger>
                        <SelectContent>
                          {assignments.map((assignment) => (
                            <SelectItem key={assignment.id} value={assignment.id}>
                              {assignment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => handleAddRecipient(recipient.id)}
                        disabled={!selectedAssignments[recipient.id]}
                        className="h-8 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isCollapsed && removedRecipients.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {removedRecipients.length}
        </div>
      )}
    </div>
  );
}
