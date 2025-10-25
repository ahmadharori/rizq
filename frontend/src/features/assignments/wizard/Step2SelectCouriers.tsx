import { useState, useEffect } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ManualModeView } from './ManualModeView';
import { RekomendasiModeView } from './RekomendasiModeView';
import type { WizardState } from '@/types/wizard';
import type { CourierListItem } from '@/types/courier';
import * as courierService from '@/services/courierService';

interface Step2SelectCouriersProps {
  state: WizardState;
  actions: ReturnType<typeof import('@/hooks/useWizardState')['useWizardState']>['actions'];
  onNext: () => void;
  onBack: () => void;
}

export const Step2SelectCouriers = ({
  state,
  actions,
}: Step2SelectCouriersProps) => {
  const [couriers, setCouriers] = useState<CourierListItem[]>([]);
  const [isLoadingCouriers, setIsLoadingCouriers] = useState(true);

  // Fetch couriers on mount
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        setIsLoadingCouriers(true);
        const response = await courierService.getCouriers({ page: 1, per_page: 100 });
        setCouriers(response.items);
        // Convert CourierListItem to Courier by adding updated_at field
        const couriersWithUpdatedAt = response.items.map(item => ({
          ...item,
          updated_at: item.created_at, // Use created_at as fallback for updated_at
        }));
        actions.setCouriers(couriersWithUpdatedAt);
      } catch (error) {
        toast.error('Gagal memuat data pengantar');
        console.error('Failed to fetch couriers:', error);
      } finally {
        setIsLoadingCouriers(false);
      }
    };

    fetchCouriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only fetch once on mount

  // Validation logic



  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {state.assignmentMode === 'manual' ? 'Buat Kelompok Pengantar' : 'Pilih Pengantar'}
          </h2>
          <p className="text-gray-600 mt-1">
            {state.assignmentMode === 'manual'
              ? 'Kelompokkan penerima secara manual dan pilih pengantar untuk setiap kelompok'
              : 'Pilih pengantar yang tersedia, sistem akan membuat kelompok optimal secara otomatis'}
          </p>
        </div>

        {/* Mode Indicator */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {state.assignmentMode === 'manual' ? (
            <>
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">Mode: Manual</div>
                <div className="text-sm text-blue-700">
                  {state.selectedRecipientIds.length} penerima terpilih
                </div>
              </div>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">Mode: Rekomendasi (CVRP)</div>
                <div className="text-sm text-blue-700">
                  {state.selectedRecipientIds.length} penerima • Kapasitas:{' '}
                  {state.capacityPerCourier || 0} paket/pengantar
                </div>
              </div>
            </>
          )}
        </div>

        {/* Conditional Content */}
        {isLoadingCouriers ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Memuat data pengantar...</span>
            </div>
          </div>
        ) : state.assignmentMode === 'manual' ? (
          <ManualModeView state={state} actions={actions} couriers={couriers} />
        ) : (
          <RekomendasiModeView state={state} actions={actions} couriers={couriers} />
        )}
      </div>
    </div>
  );
};
