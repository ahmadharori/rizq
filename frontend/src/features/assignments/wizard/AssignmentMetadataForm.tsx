import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AssignmentMetadata } from '@/types/wizard';

interface AssignmentMetadataFormProps {
  metadata: AssignmentMetadata;
  onUpdate: (metadata: AssignmentMetadata) => void;
}

export default function AssignmentMetadataForm({ metadata, onUpdate }: AssignmentMetadataFormProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignment Name */}
        <div className="space-y-2">
          <Label htmlFor="assignment-name">Nama Assignment</Label>
          <Input
            id="assignment-name"
            type="text"
            placeholder="Misal: Pengiriman Jakarta 18 Okt 2025"
            value={metadata.assignmentName}
            onChange={(e) => onUpdate({ ...metadata, assignmentName: e.target.value })}
          />
        </div>

        {/* Delivery Date */}
        <div className="space-y-2">
          <Label htmlFor="delivery-date">Tanggal Pengiriman</Label>
          <Input
            id="delivery-date"
            type="date"
            value={metadata.deliveryDate || ''}
            onChange={(e) => onUpdate({ ...metadata, deliveryDate: e.target.value || null })}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input
            id="notes"
            type="text"
            placeholder="Tambahkan catatan jika diperlukan"
            value={metadata.notes}
            onChange={(e) => onUpdate({ ...metadata, notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
