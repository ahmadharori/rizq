/**
 * CourierList Page
 * Displays a list of couriers with search, sort, pagination, and delete functionality
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronUp, ChevronDown, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { getCouriers, deleteCourier, bulkDeleteCouriers } from '@/services/courierService';
import type { CourierListItem, CourierListParams } from '@/types/courier';

export default function CourierList() {
  const navigate = useNavigate();
  const [couriers, setCouriers] = useState<CourierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch couriers
  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const params: CourierListParams = {
        page,
        per_page: perPage,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const data = await getCouriers(params);
      setCouriers(data.items);
      setTotalItems(data.pagination.total_items);
      setTotalPages(data.pagination.total_pages);
    } catch (error: any) {
      toast.error('Gagal memuat data kurir', {
        description: error.response?.data?.detail || 'Terjadi kesalahan saat memuat data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, [page, perPage, search, sortBy, sortOrder]);

  // Sorting
  const handleSort = (column: 'name' | 'phone' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: 'name' | 'phone' | 'created_at' }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="inline w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="inline w-4 h-4 ml-1" />
    );
  };

  // Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(couriers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Delete
  const openDeleteDialog = (type: 'single' | 'bulk', id?: string) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (deleteTarget?.type === 'single' && deleteTarget.id) {
        await deleteCourier(deleteTarget.id);
        toast.success('Kurir berhasil dihapus');
      } else if (deleteTarget?.type === 'bulk') {
        const result = await bulkDeleteCouriers({ ids: selectedIds });
        toast.success(`${result.deleted_count} kurir berhasil dihapus`);
        setSelectedIds([]);
      }
      fetchCouriers();
    } catch (error: any) {
      toast.error('Gagal menghapus kurir', {
        description: error.response?.data?.detail || 'Terjadi kesalahan',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Daftar Pengantar</h1>
        <p className="text-muted-foreground mt-1">Kelola data pengantar/kurir</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Cari nama atau nomor telepon..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog('bulk')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus {selectedIds.length} dipilih
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => navigate('/couriers/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengantar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={couriers.length > 0 && selectedIds.length === couriers.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Nama <SortIcon column="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('phone')}
              >
                No. Telepon <SortIcon column="phone" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('created_at')}
              >
                Tanggal Dibuat <SortIcon column="created_at" />
              </TableHead>
              <TableHead className="w-32">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : couriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada data kurir
                </TableCell>
              </TableRow>
            ) : (
              couriers.map((courier) => (
                <TableRow key={courier.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(courier.id)}
                      onChange={(e) => handleSelectOne(courier.id, e.target.checked)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{courier.name}</TableCell>
                  <TableCell>{courier.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(courier.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/couriers/${courier.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog('single', courier.id)}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => {
              setPerPage(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({totalItems} total)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'single'
                ? 'Apakah Anda yakin ingin menghapus kurir ini?'
                : `Apakah Anda yakin ingin menghapus ${selectedIds.length} kurir yang dipilih?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
