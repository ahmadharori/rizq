import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WizardStepIndicator } from './WizardStepIndicator';
import { useWizardState } from '@/hooks/useWizardState';
import { recipientService } from '@/services/recipientService';
import { getCouriers } from '@/services/courierService';
import { RecipientStatus } from '@/types/recipient';
import { toast } from 'sonner';
import { createAssignment, createBulkAssignments, type CreateAssignmentRequest } from '@/services/assignmentService';
import optimizationService from '@/services/optimizationService';

// Step components
import { Step1ViewRecipients } from './Step1ViewRecipients';
import { Step2SelectCouriers } from './Step2SelectCouriers';
import Step3PreviewAndEdit from './Step3PreviewAndEdit';

export const AssignmentWizard = () => {
  const navigate = useNavigate();
  const { state, actions } = useWizardState();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load recipients and couriers on mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        
        // Fetch initial recipients (first page, 10 items) and all couriers
        const [recipientsResponse, couriersResponse] = await Promise.all([
          recipientService.getAll({
            page: 1,
            per_page: 10,
            status: RecipientStatus.UNASSIGNED
          }),
          getCouriers({
            per_page: 10 // Get all couriers
          })
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        // Convert RecipientListItem to Recipient format for wizard state
        const recipients = recipientsResponse.items.map(item => ({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          province_id: item.province.id,
          city_id: item.city.id
        }));

        // Convert CourierListItem to Courier format for wizard state
        const couriers = couriersResponse.items.map(item => ({
          ...item,
          updated_at: new Date().toISOString()
        }));

        actions.setRecipients(recipients);
        actions.setCouriers(couriers);
        setTotalRecipients(recipientsResponse.pagination.total_items);
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error loading data:', error);
        toast.error('Gagal memuat data penerima dan pengantar');
        setLoadError(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Function to fetch recipients based on pagination
  const fetchRecipients = async (page: number, perPage: number, search?: string) => {
    try {
      setLoadingRecipients(true);
      
      const response = await recipientService.getAll({
        page,
        per_page: perPage,
        status: RecipientStatus.UNASSIGNED,
        search: search || undefined
      });

      const recipients = response.items.map(item => ({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        province_id: item.province.id,
        city_id: item.city.id
      }));

      actions.setRecipients(recipients);
      setTotalRecipients(response.pagination.total_items);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Gagal memuat data penerima');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleNext = () => {
    // Validation before proceeding
    if (state.currentStep === 1) {
      if (state.selectedRecipientIds.length === 0) {
        alert('Pilih minimal 1 penerima');
        return;
      }
      if (state.assignmentMode === 'rekomendasi' && !state.capacityPerCourier) {
        alert('Masukkan kapasitas maksimal per pengantar');
        return;
      }
    }

    if (state.currentStep === 2) {
      if (state.assignmentMode === 'manual') {
        // Manual mode: check if all groups have couriers
        if (state.manualGroups.length === 0) {
          alert('Buat minimal 1 kelompok');
          return;
        }
        const unassignedGroup = state.manualGroups.find(g => !g.courierId);
        if (unassignedGroup) {
          alert(`Kelompok "${unassignedGroup.name}" belum memiliki pengantar`);
          return;
        }
      } else {
        // Rekomendasi mode: check selectedCourierIds
        if (state.selectedCourierIds.length === 0) {
          alert('Pilih minimal 1 pengantar');
          return;
        }
      }
    }

    actions.nextStep();
  };

  const handleBack = () => {
    actions.previousStep();
  };

  const handleCancel = () => {
    if (confirm('Batalkan pembuatan assignment? Data yang sudah diinput akan hilang.')) {
      actions.resetWizard();
      navigate('/recipients');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!state.assignmentMetadata.assignmentName?.trim()) {
      toast.error('Nama assignment wajib diisi');
      return;
    }

    if (!state.assignmentMetadata.deliveryDate) {
      toast.error('Tanggal pengantaran wajib diisi');
      return;
    }

    if (state.assignments.length === 0) {
      toast.error('Tidak ada assignment yang akan disimpan');
      return;
    }

    setIsSaving(true);

    try {
      // Transform wizard state to API format
      const assignmentRequests: CreateAssignmentRequest[] = await Promise.all(
        state.assignments.map(async (assignment) => {
          // Calculate leg-by-leg distances for this assignment
          const legs = await optimizationService.calculateRouteLegDistances(
            assignment.recipientIds
          );

          const recipients = assignment.recipientIds.map((recipientId, index) => {
            // Get distance/duration from calculated legs
            const leg = legs[index];
            const distanceFromPrevious = leg?.distanceMeters || 0;
            const durationFromPrevious = leg?.durationSeconds || 0;

            return {
              recipient_id: recipientId,
              sequence_order: index + 1,
              distance_from_previous_meters: distanceFromPrevious,
              duration_from_previous_seconds: durationFromPrevious,
            };
          });

          // Calculate totals
          const totalDistance = assignment.routeData?.totalDistanceMeters || 0;
          const totalDuration = assignment.routeData?.totalDurationSeconds || 0;

          return {
            name: state.assignmentMetadata.assignmentName,
            courier_id: assignment.courierId,
            route_data: assignment.routeData,
            total_distance_meters: totalDistance,
            total_duration_seconds: totalDuration,
            recipients,
          };
        })
      );

      // Use bulk create if multiple assignments, single create otherwise
      let createdAssignments;
      
      if (assignmentRequests.length === 1) {
        const created = await createAssignment(assignmentRequests[0]);
        createdAssignments = [created];
      } else {
        createdAssignments = await createBulkAssignments({
          assignments: assignmentRequests
        });
      }

      // Success!
      const successCount = createdAssignments.length;
      const totalCount = assignmentRequests.length;

      if (successCount === totalCount) {
        toast.success(`Berhasil membuat ${successCount} assignment!`);
      } else {
        toast.warning(
          `Berhasil membuat ${successCount} dari ${totalCount} assignment. Beberapa gagal disimpan.`
        );
      }

      // Reset wizard and navigate
      actions.resetWizard();
      navigate('/recipients');

    } catch (error: any) {
      console.error('Save assignment failed:', error);
      
      const errorMessage = error.response?.data?.detail || 'Gagal menyimpan assignment. Silakan coba lagi.';
      
      if (typeof errorMessage === 'string') {
        toast.error(errorMessage);
      } else if (errorMessage.message) {
        toast.error(errorMessage.message);
      } else {
        toast.error('Gagal menyimpan assignment. Silakan coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">Gagal Memuat Data</p>
            <p className="text-sm text-gray-600 mt-2">Terjadi kesalahan saat mengambil data penerima dan pengantar</p>
          </div>
          <Button onClick={handleRetry} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      );
    }

    switch (state.currentStep) {
      case 1:
        return (
          <Step1ViewRecipients 
            state={state} 
            actions={actions}
            onFetchRecipients={fetchRecipients}
            totalRecipients={totalRecipients}
            isLoadingRecipients={loadingRecipients}
          />
        );
      case 2:
        return (
          <Step2SelectCouriers
            state={state}
            actions={actions}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return <Step3PreviewAndEdit state={state} actions={actions} />;
      case 4:
        return <div className="p-8 text-center">Step 4 - Coming Soon</div>;
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (loading) return false;
    
    if (state.currentStep === 1) {
      if (state.selectedRecipientIds.length === 0) return false;
      if (state.assignmentMode === 'rekomendasi' && !state.capacityPerCourier) return false;
    }
    
    if (state.currentStep === 2) {
      if (state.assignmentMode === 'manual') {
        // Manual mode: check if all groups have couriers
        if (state.manualGroups.length === 0) return false;
        if (state.manualGroups.some(g => !g.courierId)) return false;
      } else {
        // Rekomendasi mode: check selectedCourierIds
        if (state.selectedCourierIds.length === 0) return false;
      }
    }
    
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Buat Assignment Baru</h1>
        <p className="text-gray-600 mt-2">
          Ikuti langkah-langkah berikut untuk membuat assignment pengantaran
        </p>
      </div>

      {/* Step Indicator */}
      <WizardStepIndicator currentStep={state.currentStep} />

      {/* Main Content */}
      <Card className="mt-6">
        {renderStep()}
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <div>
          {state.currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Batal
          </Button>

          {state.currentStep < 4 && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Selanjutnya
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {state.currentStep === 3 && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !state.assignmentMetadata.assignmentName || !state.assignmentMetadata.deliveryDate}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Assignment'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
