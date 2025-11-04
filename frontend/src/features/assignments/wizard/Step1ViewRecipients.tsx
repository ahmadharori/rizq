import { useState, useMemo, useEffect } from 'react';
import { MapPin, List, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapView } from '@/components/maps/MapView';
import { MapLegend } from '@/components/maps/MapLegend';
import { CityGroupedTables } from './CityGroupedTables';
import { useMapSync } from '@/hooks/useMapSync';
import type { WizardState } from '@/types/wizard';
import { cn } from '@/utils/cn';
import { groupRecipientsByCity } from '@/utils/wizardConstants';

interface Step1ViewRecipientsProps {
  state: WizardState;
  actions: ReturnType<typeof import('@/hooks/useWizardState')['useWizardState']>['actions'];
  onFetchRecipients: (page: number, perPage: number, search?: string) => Promise<void>;
  totalRecipients: number;
  isLoadingRecipients: boolean;
}

export const Step1ViewRecipients = ({ 
  state, 
  actions, 
  onFetchRecipients, 
  totalRecipients,
  isLoadingRecipients 
}: Step1ViewRecipientsProps) => {
  const [inputValue, setInputValue] = useState(''); // For immediate display
  const [searchQuery, setSearchQuery] = useState(''); // For actual API search
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { hoveredId, handleMarkerHover, handleRowHover, handleMarkerClick } = useMapSync();

  // Debounced search: trigger API call 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        setSearchQuery(inputValue);
        setCurrentPage(1);
        fetchData(1, itemsPerPage, inputValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, itemsPerPage]); // Re-run when inputValue changes

  // Fetch data when pagination changes
  const fetchData = async (page: number, perPage: number, search: string = '') => {
    await onFetchRecipients(page, perPage, search);
  };

  // Filter recipients (only Unassigned for now) - but now data comes from API
  const unassignedRecipients = state.recipients.filter(r => r.status === 'Unassigned');
  
  // No need for local filtering anymore - API handles it
  const displayRecipients = unassignedRecipients;

  // Pagination calculations from API response
  const totalPages = Math.ceil(totalRecipients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecipients);

  // Handle input change - just update the display value
  const handleSearchChange = (value: string) => {
    setInputValue(value);
  };

  // Reset to page 1 and fetch when items per page changes
  const handleItemsPerPageChange = async (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    await fetchData(1, value, searchQuery);
  };

  // Fetch when page changes
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await fetchData(page, itemsPerPage, searchQuery);
  };

  const handleSelectAll = () => {
    if (state.selectedRecipientIds.length === displayRecipients.length) {
      actions.deselectAllRecipients();
    } else {
      actions.selectAllRecipients();
    }
  };

  const allSelected = displayRecipients.length > 0 && 
    state.selectedRecipientIds.length === displayRecipients.length;

  // Group recipients by city for city mode
  const cityGroups = useMemo(() => {
    if (state.viewMode !== 'city') return [];
    return groupRecipientsByCity(displayRecipients);
  }, [state.viewMode, displayRecipients]);

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Pilih Penerima</h2>
          <p className="text-gray-600 mt-1">
            Pilih penerima yang akan dimasukkan dalam assignment pengantaran
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={state.viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => actions.setViewMode('all')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Semua
          </Button>
          <Button
            variant={state.viewMode === 'city' ? 'default' : 'outline'}
            onClick={() => actions.setViewMode('city')}
            className="gap-2"
          >
            <MapPin className="w-4 h-4" />
            Per Kabupaten/Kota
          </Button>
        </div>

        {/* Split Layout: Map (Left Sticky) + Table (Right Scrollable) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Map + Legend (Sticky) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <MapView
                recipients={displayRecipients}
                selectedIds={state.selectedRecipientIds}
                hoveredId={hoveredId}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={handleMarkerHover}
                showDepot={true}
                height="600px"
                viewMode={state.viewMode}
                cityGroups={cityGroups}
              />
              <MapLegend viewMode={state.viewMode} recipients={displayRecipients} />
            </div>
          </div>

          {/* Right Column - Table (Scrollable) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Controls */}
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Cari penerima..."
                  value={inputValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  disabled={isLoadingRecipients}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tampilkan:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                    disabled={isLoadingRecipients}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  {state.selectedRecipientIds.length} dari {totalRecipients} dipilih
                </div>
              </div>
            </div>

            {/* Conditional Rendering: City Mode vs All Mode */}
          {state.viewMode === 'city' ? (
            <CityGroupedTables
              cityGroups={cityGroups}
              selectedIds={state.selectedRecipientIds}
              hoveredId={hoveredId}
              onToggleRecipient={actions.toggleRecipient}
              onRowHover={handleRowHover}
              isLoading={isLoadingRecipients}
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Nomor Telpon
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Alamat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Kabupaten/Kota
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Paket
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoadingRecipients ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada penerima dengan status "Unassigned"
                      </td>
                    </tr>
                  ) : (
                    displayRecipients.map((recipient, index) => {
                      const isSelected = state.selectedRecipientIds.includes(recipient.id);
                      const isHovered = hoveredId === recipient.id;
                      const absoluteIndex = startIndex + index + 1;

                      return (
                        <tr
                          key={recipient.id}
                          id={`recipient-row-${recipient.id}`}
                          className={cn(
                            'transition-colors cursor-pointer',
                            isHovered && 'bg-blue-50',
                            isSelected && 'bg-blue-50'
                          )}
                          onMouseEnter={() => handleRowHover(recipient.id)}
                          onMouseLeave={() => handleRowHover(null)}
                          onClick={() => actions.toggleRecipient(recipient.id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => actions.toggleRecipient(recipient.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {absoluteIndex}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {recipient.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {recipient.phone}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {recipient.address}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {recipient.city?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {recipient.num_packages}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}

            {/* Pagination Controls */}
            {!isLoadingRecipients && totalRecipients > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} - {endIndex} dari {totalRecipients} penerima
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isLoadingRecipients}
                >
                  Pertama
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoadingRecipients}
                >
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1];
                      const showEllipsisBefore = prevPage && page - prevPage > 1;
                      
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            disabled={isLoadingRecipients}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isLoadingRecipients}
                >
                  Selanjutnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || isLoadingRecipients}
                >
                  Terakhir
                </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Mode Selection */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Mode Assignment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manual Mode */}
            <button
              onClick={() => actions.setAssignmentMode('manual')}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                state.assignmentMode === 'manual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center',
                  state.assignmentMode === 'manual'
                    ? 'border-blue-500'
                    : 'border-gray-300'
                )}>
                  {state.assignmentMode === 'manual' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Manual</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Buat kelompok penerima secara manual, sistem akan optimasi urutan kunjungan
                  </div>
                </div>
              </div>
            </button>

            {/* Rekomendasi Mode */}
            <button
              onClick={() => actions.setAssignmentMode('rekomendasi')}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                state.assignmentMode === 'rekomendasi'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center',
                  state.assignmentMode === 'rekomendasi'
                    ? 'border-blue-500'
                    : 'border-gray-300'
                )}>
                  {state.assignmentMode === 'rekomendasi' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rekomendasi (CVRP)</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Sistem akan otomatis membuat kelompok optimal berdasarkan kapasitas
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Capacity Input for Rekomendasi Mode */}
          {state.assignmentMode === 'rekomendasi' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <Label htmlFor="capacity" className="text-sm font-medium text-gray-900">
                Kapasitas Maksimal per Pengantar (jumlah paket)
              </Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="Contoh: 12"
                value={state.capacityPerCourier || ''}
                onChange={(e) => actions.setCapacity(e.target.value ? parseInt(e.target.value) : null)}
                className="mt-2 max-w-xs"
              />
              <p className="text-xs text-gray-600 mt-1">
                Sistem akan membagi penerima berdasarkan kapasitas yang Anda masukkan
              </p>

              {/* Traffic Toggle */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="useTraffic"
                    checked={state.useTraffic}
                    onChange={(e) => actions.setUseTraffic(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="useTraffic" className="font-medium text-gray-900 cursor-pointer">
                      Gunakan Data Traffic Real-Time
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Optimasi dengan mempertimbangkan kondisi lalu lintas saat ini.{' '}
                      <strong className="text-orange-600">Biaya lebih tinggi jika melebihi free tier.</strong>
                    </p>
                  </div>
                </div>

                {/* Cost Warning Alert */}
                {state.useTraffic && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-orange-800">
                        <strong>Perhatian Biaya:</strong> Mode traffic menggunakan Routes API Pro SKU. 
                        Free tier: 5.000 elemen/bulan. Estimasi penggunaan untuk {state.selectedRecipientIds.length} penerima: 
                        <strong> ~{Math.pow(state.selectedRecipientIds.length + 1, 2)} elemen</strong>.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
