import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { WizardState } from '@/types/wizard';
import optimizationService from '@/services/optimizationService';
import { getDepotLocation } from '@/utils/wizardConstants';
import OptimizationProgress from './OptimizationProgress';
import MapWithRoutes from './MapWithRoutes';
import CourierRouteTable from './CourierRouteTable';
import RemovedRecipientsPanel from './RemovedRecipientsPanel';
import AssignmentMetadataForm from './AssignmentMetadataForm';

interface Step3Props {
  state: WizardState;
  actions: {
    setAssignments: (assignments: WizardState['assignments']) => void;
    setAssignmentMetadata: (metadata: WizardState['assignmentMetadata']) => void;
    moveRecipientBetweenAssignments: (recipientId: string, fromAssignmentId: string, toAssignmentId: string, newIndex: number) => void;
    reorderRecipientsInAssignment: (assignmentId: string, recipientIds: string[]) => void;
    removeRecipientFromAssignment: (assignmentId: string, recipientId: string) => void;
    addRecipientToAssignment: (assignmentId: string, recipientId: string, index?: number) => void;
    updateRouteData: (assignmentId: string, routeData: any) => void;
  };
}

export default function Step3PreviewAndEdit({ state, actions }: Step3Props) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState('');

  // Run optimization on mount if assignments are empty
  useEffect(() => {
    if (state.assignments.length === 0) {
      runOptimization();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOptimization = async () => {
    setIsOptimizing(true);

    try {
      if (state.assignmentMode === 'manual') {
        // Manual Mode: Run TSP for each group
        setOptimizationProgress('Mengoptimalkan rute untuk setiap grup...');
        
        const assignments = await optimizationService.runTSPForGroups(
          state.manualGroups,
          getDepotLocation()
        );

        actions.setAssignments(assignments);
        toast.success('Optimasi rute berhasil!');
      } else {
        // Rekomendasi Mode: Run CVRP
        setOptimizationProgress('Menjalankan algoritma CVRP...');

        const cvrpResponse = await optimizationService.runCVRP(
          state.selectedRecipientIds,
          state.selectedCourierIds.length,
          state.capacityPerCourier || 20,
          getDepotLocation()
        );

        const assignments = optimizationService.convertCVRPToAssignments(
          cvrpResponse,
          state.selectedCourierIds
        );

        actions.setAssignments(assignments);
        
        toast.success(
          `Optimasi berhasil! ${cvrpResponse.num_routes} rute dibuat (Balance: ${cvrpResponse.route_balance_status})`
        );
      }
    } catch (error: any) {
      console.error('Optimization failed:', error);
      toast.error(error.response?.data?.detail || 'Optimasi gagal. Silakan coba lagi.');
      
      // Fallback: Create basic assignments without optimization
      if (state.assignmentMode === 'manual') {
        const basicAssignments = state.manualGroups.map(group => ({
          id: group.id,
          name: group.name,
          courierId: group.courierId || '',
          recipientIds: group.recipientIds,
          routeData: undefined,
        }));
        actions.setAssignments(basicAssignments);
      }
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress('');
    }
  };

  // Validate before allowing to proceed

  // Get courier color for consistent visualization
  const getCourierColor = (courierId: string): string => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
    ];

    // Extract unique courier IDs from assignments (works for both Manual and Rekomendasi modes)
    const uniqueCourierIds = Array.from(
      new Set(state.assignments.map(a => a.courierId).filter(Boolean))
    ).sort(); // Sort for consistency

    const courierIndex = uniqueCourierIds.indexOf(courierId);
    return colors[courierIndex % colors.length];
  };

  if (isOptimizing) {
    return <OptimizationProgress message={optimizationProgress} />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Metadata Form */}
      <AssignmentMetadataForm
        metadata={state.assignmentMetadata}
        onUpdate={actions.setAssignmentMetadata}
      />

      {/* Map Section */}
      <div className="h-96 border rounded-lg overflow-hidden">
        <MapWithRoutes
          assignments={state.assignments}
          recipients={state.recipients}
          getCourierColor={getCourierColor}
        />
      </div>

      {/* Tables Section */}
      <div className="flex gap-4 flex-1">
        {/* Courier Tables */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {state.assignments.map((assignment) => {
            const courier = state.couriers.find(c => c.id === assignment.courierId);
            const assignmentRecipients = state.recipients.filter(r =>
              assignment.recipientIds.includes(r.id)
            );
            const totalPackages = optimizationService.calculateTotalPackages(
              assignment.recipientIds,
              state.recipients
            );

            return (
              <CourierRouteTable
                key={assignment.id}
                assignment={assignment}
                courier={courier}
                recipients={assignmentRecipients}
                recipientOrder={assignment.recipientIds}
                totalPackages={totalPackages}
                capacity={state.capacityPerCourier}
                color={getCourierColor(assignment.courierId)}
                onReorder={(recipientIds: string[]) => {
                  actions.reorderRecipientsInAssignment(assignment.id, recipientIds);
                }}
                onRemove={(recipientId: string) => {
                  actions.removeRecipientFromAssignment(assignment.id, recipientId);
                }}
              />
            );
          })}
        </div>

        {/* Removed Recipients Panel */}
        <RemovedRecipientsPanel
          removedRecipientIds={state.removedRecipientIds}
          recipients={state.recipients}
          assignments={state.assignments}
          onAddToAssignment={actions.addRecipientToAssignment}
        />
      </div>
    </div>
  );
}
