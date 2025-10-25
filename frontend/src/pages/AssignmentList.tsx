/**
 * Assignment List Page
 * Display paginated list of assignments with search and filters
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentService } from '@/services/assignmentService';
import type { AssignmentListItem, AssignmentFilters } from '@/types/assignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function AssignmentList() {
  const navigate = useNavigate();
  
  // State management
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<AssignmentFilters>({
    search: '',
    courier_id: undefined,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch assignments when dependencies change
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await assignmentService.getAll({
          page,
          per_page: perPage,
          search: filters.search,
          courier_id: filters.courier_id,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order
        });

        setAssignments(response.items);
        setTotalItems(response.pagination.total_items);
        setTotalPages(response.pagination.total_pages);
      } catch (err) {
        setError('Gagal memuat data assignment');
        toast.error('Gagal memuat data assignment');
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssignments();
  }, [page, perPage, filters.search, filters.courier_id, filters.sort_by, filters.sort_order]);

  // Handle row click
  const handleRowClick = (id: string) => {
    navigate(`/assignments/${id}`);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Assignment</h1>
        <Button onClick={() => navigate('/assignments/create')}>
          + Buat Assignment
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Cari nama assignment..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
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
                  <TableHead className="w-16">No</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nama Assignment
                      {filters.sort_by === 'name' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('courier_name')}
                  >
                    <div className="flex items-center gap-2">
                      Kurir
                      {filters.sort_by === 'courier_name' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Jumlah Penerima</TableHead>
                  <TableHead className="text-right">Total Jarak</TableHead>
                  <TableHead className="text-right">Total Durasi</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Tanggal Dibuat
                      {filters.sort_by === 'created_at' && (
                        filters.sort_order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Belum ada assignment
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment, index) => (
                    <TableRow
                      key={assignment.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(assignment.id)}
                    >
                      <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                      <TableCell className="font-medium">{assignment.name}</TableCell>
                      <TableCell>{assignment.courier_name}</TableCell>
                      <TableCell className="text-right">{assignment.total_recipients}</TableCell>
                      <TableCell className="text-right">{formatDistance(assignment.total_distance_meters)}</TableCell>
                      <TableCell className="text-right">{formatDuration(assignment.total_duration_seconds)}</TableCell>
                      <TableCell>{formatDate(assignment.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Menampilkan {assignments.length > 0 ? (page - 1) * perPage + 1 : 0} - {Math.min(page * perPage, totalItems)} dari {totalItems} assignment
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
    </div>
  );
}
