/**
 * Recipient List Page
 * Display paginated list of recipients with search and filters
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipientService } from '@/services/recipientService';
import type { RecipientListItem, RecipientFilters } from '@/types/recipient';
import { RecipientStatus } from '@/types/recipient';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { regionService } from '@/services/regionService';
import type { Province, City } from '@/types/region';

export function RecipientList() {
  const navigate = useNavigate();
  
  // State management
  const [recipients, setRecipients] = useState<RecipientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Regional data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<RecipientFilters>({
    search: '',
    status: undefined,
    province_id: undefined,
    city_id: undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  
  // Handle column sorting
  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  };

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provincesData = await regionService.getProvinces();
        setProvinces(provincesData);
      } catch (err) {
        console.error('Error fetching provinces:', err);
        toast.error('Gagal memuat data provinsi');
      }
    };

    loadProvinces();
  }, []);

  // Load cities when province is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.province_id) {
        setFilteredCities([]);
        return;
      }

      try {
        const citiesData = await regionService.getCities(filters.province_id.toString());
        setFilteredCities(citiesData);
      } catch (err) {
        console.error('Error fetching cities:', err);
        toast.error('Gagal memuat data kab/kota');
        setFilteredCities([]);
      }
    };

    loadCities();
  }, [filters.province_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch recipients when dependencies change
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await recipientService.getAll({
          page,
          per_page: perPage,
          search: filters.search,
          status: filters.status,
          province_id: filters.province_id,
          city_id: filters.city_id,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order
        });

        setRecipients(response.items);
        setTotalItems(response.pagination.total_items);
        setTotalPages(response.pagination.total_pages);
      } catch (err) {
        setError('Gagal memuat data penerima');
        toast.error('Gagal memuat data penerima');
        console.error('Error fetching recipients:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecipients();
  }, [page, perPage, filters.search, filters.status, filters.province_id, filters.city_id, filters.sort_by, filters.sort_order]);

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(recipients.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const result = await recipientService.bulkDelete(selectedIds);
      toast.success(result.message);
      setSelectedIds([]);
      setShowDeleteDialog(false);
      
      // Reload recipients after delete
      const response = await recipientService.getAll({
        page,
        per_page: perPage,
        search: filters.search,
        status: filters.status,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });
      setRecipients(response.items);
      setTotalItems(response.pagination.total_items);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      toast.error('Gagal menghapus penerima');
      console.error('Error deleting recipients:', err);
    }
  };

  // Handle row click
  const handleRowClick = (id: string) => {
    navigate(`/recipients/${id}`);
  };

  const allSelected = recipients.length > 0 && selectedIds.length === recipients.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < recipients.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Penerima</h1>
        <Button onClick={() => navigate('/recipients/create')}>
          + Buat Penerima
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Cari nama, nomor telepon, atau alamat..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              status: value === 'all' ? undefined : value as RecipientStatus
            }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={RecipientStatus.UNASSIGNED}>Unassigned</SelectItem>
            <SelectItem value={RecipientStatus.ASSIGNED}>Assigned</SelectItem>
            <SelectItem value={RecipientStatus.DELIVERY}>Delivery</SelectItem>
            <SelectItem value={RecipientStatus.DONE}>Done</SelectItem>
            <SelectItem value={RecipientStatus.RETURN}>Return</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.province_id !== undefined ? filters.province_id.toString() : 'all'}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              province_id: value === 'all' ? undefined : Number(value),
              city_id: undefined
            }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Provinsi</SelectItem>
            {provinces.map(province => (
              <SelectItem key={province.id} value={province.id.toString()}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.city_id !== undefined ? filters.city_id.toString() : 'all'}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              city_id: value === 'all' ? undefined : Number(value)
            }));
            setPage(1);
          }}
          disabled={!filters.province_id}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Kab/Kota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kab/Kota</SelectItem>
            {filteredCities.map(city => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Hapus ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someSelected;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nama
                      {filters.sort_by === 'name' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('phone')}
                  >
                    <div className="flex items-center gap-2">
                      Nomor Telepon
                      {filters.sort_by === 'phone' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {filters.sort_by === 'status' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('province.name')}
                  >
                    <div className="flex items-center gap-2">
                      Provinsi
                      {filters.sort_by === 'province.name' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('city.name')}
                  >
                    <div className="flex items-center gap-2">
                      Kab/Kota
                      {filters.sort_by === 'city.name' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('num_packages')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Jumlah Paket
                      {filters.sort_by === 'num_packages' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Tidak ada data penerima
                    </TableCell>
                  </TableRow>
                ) : (
                  recipients.map((recipient, index) => (
                    <TableRow
                      key={recipient.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        // Don't navigate if clicking checkbox
                        const target = e.target as HTMLInputElement;
                        if (target.type !== 'checkbox') {
                          handleRowClick(recipient.id);
                        }
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(recipient.id)}
                          onChange={(e) => handleSelectOne(recipient.id, e.target.checked)}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                      <TableCell className="font-medium">{recipient.name}</TableCell>
                      <TableCell>{recipient.phone}</TableCell>
                      <TableCell>
                        <StatusBadge status={recipient.status} />
                      </TableCell>
                      <TableCell>{recipient.province.name}</TableCell>
                      <TableCell>{recipient.city.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{recipient.address}</TableCell>
                      <TableCell className="text-right">{recipient.num_packages}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Menampilkan {recipients.length > 0 ? (page - 1) * perPage + 1 : 0} - {Math.min(page * perPage, totalItems)} dari {totalItems} penerima
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  ««
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  «
                </Button>
                <div className="flex items-center px-3 text-sm">
                  Halaman {page} dari {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  »
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  »»
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.length} penerima? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
