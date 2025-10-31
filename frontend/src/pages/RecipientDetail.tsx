/**
 * Recipient Detail Page
 * Display detailed information about a recipient including status history
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipientService } from '@/services/recipientService';
import type { Recipient, StatusHistoryItem } from '@/types/recipient';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, MapPin } from 'lucide-react';

export function RecipientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/recipients');
      return;
    }

    loadRecipientData();
  }, [id]);

  const loadRecipientData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [recipientData, historyData] = await Promise.all([
        recipientService.getById(id),
        recipientService.getHistory(id)
      ]);
      
      setRecipient(recipientData);
      setHistory(historyData.history);
    } catch (error) {
      console.error('Error loading recipient:', error);
      toast.error('Gagal memuat data penerima');
      navigate('/recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      await recipientService.delete(id);
      toast.success('Penerima berhasil dihapus');
      navigate('/recipients');
    } catch (error) {
      console.error('Error deleting recipient:', error);
      toast.error('Gagal menghapus penerima');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!recipient) {
    return null;
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${recipient.location.lat},${recipient.location.lng}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/recipients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold">{recipient.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/recipients/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Ubah
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi Penerima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={`https://www.google.com/maps?q=${recipient.location.lat},${recipient.location.lng}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div>Lat: {recipient.location.lat.toFixed(6)}</div>
                <div>Lng: {recipient.location.lng.toFixed(6)}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(googleMapsUrl, '_blank')}
              >
                Buka di Google Maps
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detail Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Informasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nama</label>
              <div className="mt-1 text-base">{recipient.name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Nomor Telepon</label>
              <div className="mt-1 text-base">{recipient.phone}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <StatusBadge status={recipient.status} />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Provinsi</label>
              <div className="mt-1 text-base">{recipient.province.name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Kabupaten/Kota</label>
              <div className="mt-1 text-base">{recipient.city.name}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Alamat</label>
              <div className="mt-1 text-base">{recipient.address}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Jumlah Paket</label>
              <div className="mt-1 text-base">{recipient.num_packages}</div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500">
                Dibuat: {formatDate(recipient.created_at)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Diperbarui: {formatDate(recipient.updated_at)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal & Waktu Perubahan</TableHead>
                  <TableHead>Diubah Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      Tidak ada riwayat status
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.old_status && (
                          <span className="text-gray-500">
                            <StatusBadge status={item.old_status as any} />
                            {' → '}
                          </span>
                        )}
                        <StatusBadge status={item.new_status as any} />
                      </TableCell>
                      <TableCell>{formatDate(item.changed_at)}</TableCell>
                      <TableCell>{item.changed_by_username || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus penerima <strong>{recipient.name}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
