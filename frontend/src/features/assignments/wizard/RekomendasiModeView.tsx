import { useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { WizardState } from '@/types/wizard';
import type { CourierListItem } from '@/types/courier';
import { cn } from '@/utils/cn';

interface RekomendasiModeViewProps {
  state: WizardState;
  actions: ReturnType<typeof import('@/hooks/useWizardState')['useWizardState']>['actions'];
  couriers: CourierListItem[];
}

export const RekomendasiModeView = ({
  state,
  actions,
  couriers,
}: RekomendasiModeViewProps) => {
  // Calculate distribution metrics
  const distribution = useMemo(() => {
    const selectedRecipients = state.recipients.filter(r =>
      state.selectedRecipientIds.includes(r.id)
    );
    const totalRecipients = selectedRecipients.length;
    const totalPackages = selectedRecipients.reduce((sum, r) => sum + r.num_packages, 0);
    const numCouriers = state.selectedCourierIds.length;
    const capacity = state.capacityPerCourier || 0;

    const avgRecipientsPerCourier = numCouriers > 0 ? totalRecipients / numCouriers : 0;
    const avgPackagesPerCourier = numCouriers > 0 ? totalPackages / numCouriers : 0;
    const totalCapacity = numCouriers * capacity;
    const isCapacitySufficient = totalCapacity >= totalPackages;

    return {
      totalRecipients,
      totalPackages,
      numCouriers,
      avgRecipientsPerCourier,
      avgPackagesPerCourier,
      totalCapacity,
      isCapacitySufficient,
    };
  }, [state.recipients, state.selectedRecipientIds, state.selectedCourierIds, state.capacityPerCourier]);

  const handleToggleAll = () => {
    if (state.selectedCourierIds.length === couriers.length) {
      // Deselect all
      couriers.forEach(courier => {
        if (state.selectedCourierIds.includes(courier.id)) {
          actions.toggleCourier(courier.id);
        }
      });
    } else {
      // Select all
      couriers.forEach(courier => {
        if (!state.selectedCourierIds.includes(courier.id)) {
          actions.toggleCourier(courier.id);
        }
      });
    }
  };

  const allSelected = couriers.length > 0 && state.selectedCourierIds.length === couriers.length;

  return (
    <div className="space-y-6">
      {/* Courier Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pilih Pengantar</h3>
          <button
            onClick={handleToggleAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {allSelected ? 'Batalkan Semua' : 'Pilih Semua'}
          </button>
        </div>

        {couriers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data pengantar. Silakan tambah pengantar terlebih dahulu.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Nomor Telpon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {couriers.map(courier => {
                  const isSelected = state.selectedCourierIds.includes(courier.id);

                  return (
                    <tr
                      key={courier.id}
                      className={cn(
                        'transition-colors cursor-pointer hover:bg-gray-50',
                        isSelected && 'bg-blue-50'
                      )}
                      onClick={() => actions.toggleCourier(courier.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => actions.toggleCourier(courier.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {courier.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{courier.phone}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Preview */}
      {distribution.numCouriers > 0 && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-start gap-3 mb-4">
            {distribution.isCapacitySufficient ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preview Distribusi</h3>
              <p className="text-sm text-gray-600 mt-1">
                Estimasi pembagian penerima berdasarkan pengantar yang dipilih
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600">Total Penerima</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {distribution.totalRecipients}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600">Total Paket</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {distribution.totalPackages}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600">Pengantar Dipilih</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {distribution.numCouriers}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600">Kapasitas per Pengantar</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {state.capacityPerCourier || 0}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Rata-rata Penerima per Pengantar</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">
                  ~{Math.round(distribution.avgRecipientsPerCourier)} penerima
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Rata-rata Paket per Pengantar</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">
                  ~{Math.round(distribution.avgPackagesPerCourier)} paket
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Warning */}
          {!distribution.isCapacitySufficient && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-orange-900">Kapasitas Tidak Cukup</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Total kapasitas: {distribution.totalCapacity} paket • Total paket:{' '}
                    {distribution.totalPackages} paket
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    Anda memerlukan minimal{' '}
                    <span className="font-semibold">
                      {Math.ceil(
                        distribution.totalPackages / (state.capacityPerCourier || 1)
                      )}{' '}
                      pengantar
                    </span>{' '}
                    dengan kapasitas {state.capacityPerCourier} paket.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {distribution.isCapacitySufficient && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-900">Kapasitas Mencukupi</div>
                  <div className="text-sm text-green-700 mt-1">
                    Sistem akan membuat kelompok optimal menggunakan algoritma CVRP di step
                    selanjutnya.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {distribution.numCouriers === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium">Belum ada pengantar terpilih</p>
          <p className="text-sm mt-1">Pilih minimal 1 pengantar untuk melihat preview distribusi</p>
        </div>
      )}
    </div>
  );
};
