/**
 * Assignment Detail Page
 * Display assignment details with map visualization and recipient table
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentService } from '@/services/assignmentService';
import type { AssignmentDetail } from '@/types/assignment';
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
import { StatusUpdateButton } from '@/components/assignments/StatusUpdateButton';
import { BulkStatusUpdate } from '@/components/assignments/BulkStatusUpdate';
import { StatusHistoryModal } from '@/components/assignments/StatusHistoryModal';
import MapWithRoutes from '@/features/assignments/wizard/MapWithRoutes';
import { toast } from 'sonner';
import { ArrowLeft, User, Package, Clock, MapPin, History, CheckSquare } from 'lucide-react';
import type { RecipientStatus } from '@/types/recipient';
import { Checkbox } from '@/components/ui/checkbox';

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection and modals state
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedRecipientForHistory, setSelectedRecipientForHistory] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await assignmentService.getDetail(id);
        setAssignment(data);
      } catch (err) {
        setError('Gagal memuat detail assignment');
        toast.error('Gagal memuat detail assignment');
        console.error('Error fetching assignment detail:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssignment();
  }, [id]);

  // Format distance (meters to km)
  const formatDistance = (meters: number | null): string => {
    if (meters === null) return '-';
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  // Format duration (seconds to hours and minutes)
  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle checkbox selection
  const handleCheckboxChange = (recipientId: string, checked: boolean) => {
    const newSelection = new Set(selectedRecipientIds);
    if (checked) {
      newSelection.add(recipientId);
    } else {
      newSelection.delete(recipientId);
    }
    setSelectedRecipientIds(newSelection);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && assignment) {
      setSelectedRecipientIds(new Set(assignment.recipients.map(r => r.id)));
    } else {
      setSelectedRecipientIds(new Set());
    }
  };

  // Handle status updated - reload assignment
  const handleStatusUpdated = async () => {
    if (!id) return;
    
    try {
      const data = await assignmentService.getDetail(id);
      setAssignment(data);
      setSelectedRecipientIds(new Set()); // Clear selection
    } catch (err) {
      console.error('Error reloading assignment:', err);
      toast.error('Gagal memuat ulang data');
    }
  };

  // Get selected recipients for bulk update
  const getSelectedRecipients = () => {
    if (!assignment) return [];
    return assignment.recipients.filter(r => selectedRecipientIds.has(r.id)).map(r => ({
      id: r.id,
      name: r.name,
      status: r.status as RecipientStatus
    }));
  };

  // Handle history icon click
  const handleHistoryClick = (recipientId: string) => {
    setSelectedRecipientForHistory(recipientId);
    setHistoryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">{error || 'Assignment tidak ditemukan'}</div>
        <div className="text-center">
          <Button onClick={() => navigate('/assignments')}>
            Kembali ke Daftar Assignment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/assignments')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{assignment.name}</h1>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Courier Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Kurir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Nama</div>
              <div className="font-medium">{assignment.courier.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Nomor Telepon</div>
              <div className="font-medium">{assignment.courier.phone}</div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ringkasan Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Jumlah Penerima</div>
              <div className="font-medium text-2xl">{assignment.recipients.length}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500">Total Jarak</div>
                <div className="font-medium">{formatDistance(assignment.total_distance_meters)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Durasi</div>
                <div className="font-medium">{formatDuration(assignment.total_duration_seconds)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Informasi Waktu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Dibuat</div>
              <div className="text-sm">{formatDate(assignment.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Terakhir Diperbarui</div>
              <div className="text-sm">{formatDate(assignment.updated_at)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Recipients Section */}
      <div className="flex gap-4">
        {/* Map Section (40% width, left, sticky) */}
        <div className="w-2/5 sticky top-4 self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Rute Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <MapWithRoutes
                  assignments={[
                    {
                      id: assignment.id,
                      name: assignment.name,
                      courierId: assignment.courier.id,
                      recipientIds: assignment.recipients.map(r => r.id),
                      routeData: {
                        totalDistanceMeters: assignment.total_distance_meters || 0,
                        totalDurationSeconds: assignment.total_duration_seconds || 0
                      }
                    }
                  ]}
                  recipients={assignment.recipients.map(r => ({
                    id: r.id,
                    name: r.name,
                    phone: r.phone,
                    address: r.address,
                    province_id: r.province.id,
                    city_id: r.city.id,
                    location: r.location,
                    num_packages: r.num_packages,
                    status: r.status as RecipientStatus,
                    province: {
                      id: r.province.id,
                      name: r.province.name
                    },
                    city: {
                      id: r.city.id,
                      name: r.city.name,
                      province_id: r.province.id
                    },
                    created_at: assignment.created_at,
                    updated_at: assignment.updated_at
                  }))}
                  getCourierColor={() => '#3b82f6'}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients Table Section (60% width, right, scrollable) */}
        <div className="w-3/5 overflow-x-auto">
          <Card>
            <CardHeader className="pb-3 space-y-3">
              <CardTitle className="text-base">Daftar Penerima</CardTitle>
              
              {/* Bulk Update Toolbar */}
              {selectedRecipientIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedRecipientIds.size} penerima dipilih
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setBulkUpdateOpen(true)}
                    className="ml-auto"
                  >
                    Ubah Status Massal
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecipientIds(new Set())}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecipientIds.size === assignment.recipients.length && assignment.recipients.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Jarak</TableHead>
                      <TableHead className="text-right">Durasi</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignment.recipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecipientIds.has(recipient.id)}
                            onCheckedChange={(checked) => handleCheckboxChange(recipient.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{recipient.sequence_order}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{recipient.name}</div>
                            <div className="text-sm text-gray-500">{recipient.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="text-sm">{recipient.address}</div>
                            <div className="text-xs text-gray-500">
                              {recipient.city.name}, {recipient.province.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusUpdateButton
                              assignmentId={assignment.id}
                              recipientId={recipient.id}
                              recipientName={recipient.name}
                              currentStatus={recipient.status as RecipientStatus}
                              onStatusUpdated={handleStatusUpdated}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDistance(recipient.distance_from_previous_meters)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(recipient.duration_from_previous_seconds)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleHistoryClick(recipient.id)}
                            title="Lihat Riwayat Status"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Status Update Modal */}
      <BulkStatusUpdate
        assignmentId={assignment.id}
        selectedRecipients={getSelectedRecipients()}
        open={bulkUpdateOpen}
        onOpenChange={setBulkUpdateOpen}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Status History Modal */}
      {selectedRecipientForHistory && (
        <StatusHistoryModal
          assignmentId={assignment.id}
          recipientId={selectedRecipientForHistory}
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
        />
      )}
    </div>
  );
}
