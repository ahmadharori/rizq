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
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactSelect, { components, type MultiValue } from 'react-select';
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
import { ChevronUp, ChevronDown, Users, Search } from 'lucide-react';
import { regionService } from '@/services/regionService';
import type { Province, City } from '@/types/region';

// Status select options
interface StatusOption {
  value: RecipientStatus;
  label: string;
}

const statusOptions: StatusOption[] = [
  { value: RecipientStatus.UNASSIGNED, label: 'Unassigned' },
  { value: RecipientStatus.ASSIGNED, label: 'Assigned' },
  { value: RecipientStatus.DELIVERY, label: 'Delivery' },
  { value: RecipientStatus.DONE, label: 'Done' },
  { value: RecipientStatus.RETURN, label: 'Return' },
];

// Custom components for status badges in react-select
const StatusOptionComponent = (props: any) => (
  <components.Option {...props}>
    <StatusBadge status={props.data.value} showIcon={true} />
  </components.Option>
);

const StatusMultiValueLabel = (props: any) => (
  <components.MultiValueLabel {...props}>
    <StatusBadge status={props.data.value} showIcon={false} />
  </components.MultiValueLabel>
);

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

  // Load cities when provinces are selected (cascading multi-select)
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.province_id || filters.province_id.length === 0) {
        setFilteredCities([]);
        return;
      }

      try {
        // Fetch cities for all selected provinces
        const citiesPromises = filters.province_id.map(pid => 
          regionService.getCities(pid.toString())
        );
        const citiesArrays = await Promise.all(citiesPromises);
        
        // Flatten and deduplicate cities
        const allCities = citiesArrays.flat();
        const uniqueCities = Array.from(
          new Map(allCities.map(c => [c.id, c])).values()
        );
        
        setFilteredCities(uniqueCities);
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

  // Retry function for error state
  const handleRetry = () => {
    setError(null);
    setPage(1);
    setLoading(true);
  };

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
        
        <ReactSelect
          isMulti
          options={statusOptions}
          value={statusOptions.filter(opt => filters.status?.includes(opt.value))}
          onChange={(selected) => {
            setFilters(prev => ({
              ...prev,
              status: selected && selected.length > 0 ? selected.map(s => s.value) : undefined
            }));
            setPage(1);
          }}
          components={{
            Option: StatusOptionComponent,
            MultiValueLabel: StatusMultiValueLabel
          }}
          placeholder="Filter Status"
          className="w-[250px]"
          isClearable
        />

        <ReactSelect
          isMulti
          options={provinces.map(p => ({ value: p.id, label: p.name }))}
          value={provinces
            .filter(p => filters.province_id?.includes(p.id))
            .map(p => ({ value: p.id, label: p.name }))}
          onChange={(selected) => {
            setFilters(prev => ({
              ...prev,
              province_id: selected && selected.length > 0 ? selected.map(s => Number(s.value)) : undefined,
              city_id: undefined
            }));
            setPage(1);
          }}
          placeholder="Pilih Provinsi"
          className="w-[250px]"
          isClearable
        />

        <ReactSelect
          isMulti
          options={filteredCities.map(c => ({ value: c.id, label: c.name }))}
          value={filteredCities
            .filter(c => filters.city_id?.includes(c.id))
            .map(c => ({ value: c.id, label: c.name }))}
          onChange={(selected) => {
            setFilters(prev => ({
              ...prev,
              city_id: selected && selected.length > 0 ? selected.map(s => Number(s.value)) : undefined
            }));
            setPage(1);
          }}
          isDisabled={!filters.province_id || filters.province_id.length === 0}
          placeholder="Pilih Kab/Kota"
          className="w-[250px]"
          isClearable
        />

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
        <TableSkeleton rows={perPage} columns={9} showCheckbox />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={handleRetry}
        />
      ) : recipients.length === 0 ? (
        filters.search || filters.status || filters.province_id || filters.city_id ? (
          <EmptyState
            icon={Search}
            title="Tidak Ada Hasil"
            description={`Tidak ada penerima yang cocok dengan pencarian "${filters.search || 'filter yang dipilih'}"`}
            actionLabel="Reset Filter"
            onAction={() => {
              setSearchInput('');
              setFilters({
                search: '',
                status: undefined,
                province_id: undefined,
                city_id: undefined,
                sort_by: 'created_at',
                sort_order: 'desc'
              });
            }}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Belum Ada Penerima"
            description="Mulai dengan menambahkan penerima pertama Anda"
            actionLabel="+ Buat Penerima"
            onAction={() => navigate('/recipients/create')}
          />
        )
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
                {recipients.map((recipient, index) => (
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
                ))}
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
