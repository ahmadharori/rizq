import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageCircle, Loader2, Copy } from 'lucide-react';
import {
  generateWhatsAppMessage,
  generateWhatsAppLink,
  openWhatsApp,
  copyToClipboard,
} from '@/utils/whatsappHelper';
import type { AssignmentDetail } from '@/types/assignment';

interface WhatsAppButtonProps {
  assignment: AssignmentDetail;
  depotLat: number;
  depotLng: number;
}

export function WhatsAppButton({ assignment, depotLat, depotLng }: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendWhatsApp = async () => {
    // Validation
    if (!assignment.courier.phone) {
      toast.error('Pengantar belum memiliki nomor telepon');
      return;
    }

    setLoading(true);

    try {
      // Generate message
      const messageBody = generateWhatsAppMessage(
        assignment.name,
        assignment.recipients,
        assignment.total_distance_meters,
        assignment.total_duration_seconds,
        depotLat,
        depotLng
      );

      setMessage(messageBody);

      // Check message length
      const encodedLength = encodeURIComponent(messageBody).length;
      if (encodedLength > 2000) {
        toast.warning('Pesan terlalu panjang. Sebagian informasi mungkin terpotong.');
      }

      // Generate WhatsApp link
      const whatsappUrl = generateWhatsAppLink(assignment.courier.phone, messageBody);

      // Try to open
      const success = openWhatsApp(whatsappUrl);

      if (success) {
        toast.success('Membuka WhatsApp...');
      } else {
        // Fallback: show modal
        setFallbackOpen(true);
      }
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      toast.error('Gagal membuat pesan WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(message);
    if (success) {
      toast.success('Pesan berhasil disalin ke clipboard');
      setFallbackOpen(false);
    } else {
      toast.error('Gagal menyalin pesan');
    }
  };

  return (
    <>
      <Button
        onClick={handleSendWhatsApp}
        disabled={loading || !assignment.courier.phone}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4 mr-2" />
        )}
        Kirim Data Penerima
      </Button>

      {/* Fallback Modal */}
      <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pesan WhatsApp</DialogTitle>
            <DialogDescription>
              Tidak dapat membuka WhatsApp secara otomatis. Salin pesan di bawah dan kirim manual.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <textarea
              readOnly
              value={message}
              className="w-full h-96 p-4 border rounded-md font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFallbackOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleCopyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Salin ke Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
