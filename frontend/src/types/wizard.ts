import type { Recipient } from './recipient';
import type { Courier } from './courier';

// Wizard Step Type
export type WizardStep = 1 | 2 | 3 | 4;

// View Mode for Step 1
export type ViewMode = 'all' | 'city';

// Assignment Mode
export type AssignmentMode = 'manual' | 'rekomendasi';

// Manual Group (for manual mode)
export interface ManualGroup {
  id: string;
  name: string;
  recipientIds: string[];
  courierId?: string;
}

// Wizard State
export interface WizardState {
  currentStep: WizardStep;
  
  // Step 1: Recipient Selection
  viewMode: ViewMode;
  selectedRecipientIds: string[];
  assignmentMode: AssignmentMode;
  
  // Manual Mode
  manualGroups: ManualGroup[];
  
  // Rekomendasi Mode
  capacityPerCourier: number | null;
  
  // Step 2: Courier Selection
  selectedCourierIds: string[];
  
  // Step 3: Preview & Edit
  assignments: PreviewAssignment[];
  
  // Additional state
  recipients: Recipient[];
  couriers: Courier[];
}

// Preview Assignment (for Step 3)
export interface PreviewAssignment {
  id: string; // temporary ID
  name: string;
  courierId: string;
  recipientIds: string[]; // ordered by sequence
  routeData?: RouteData;
}

// Route Data (from optimization API)
export interface RouteData {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polyline?: string;
  legs?: RouteLeg[];
}

export interface RouteLeg {
  fromLocation: { lat: number; lng: number };
  toLocation: { lat: number; lng: number };
  distanceMeters: number;
  durationSeconds: number;
}

// Map-related types
export interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  recipient: Recipient;
  color: string;
  isSelected: boolean;
  isHovered: boolean;
}

// Depot Location
export interface DepotLocation {
  lat: number;
  lng: number;
}

// Step Indicator
export interface StepInfo {
  number: WizardStep;
  label: string;
  description: string;
}

// Wizard Actions
export type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_ASSIGNMENT_MODE'; mode: AssignmentMode }
  | { type: 'TOGGLE_RECIPIENT'; recipientId: string }
  | { type: 'SELECT_ALL_RECIPIENTS' }
  | { type: 'DESELECT_ALL_RECIPIENTS' }
  | { type: 'SET_CAPACITY'; capacity: number | null }
  | { type: 'ADD_MANUAL_GROUP'; group: ManualGroup }
  | { type: 'REMOVE_MANUAL_GROUP'; groupId: string }
  | { type: 'UPDATE_MANUAL_GROUP'; groupId: string; group: Partial<ManualGroup> }
  | { type: 'TOGGLE_COURIER'; courierId: string }
  | { type: 'SET_ASSIGNMENTS'; assignments: PreviewAssignment[] }
  | { type: 'UPDATE_ASSIGNMENT'; assignmentId: string; assignment: Partial<PreviewAssignment> }
  | { type: 'SET_RECIPIENTS'; recipients: Recipient[] }
  | { type: 'SET_COURIERS'; couriers: Courier[] }
  | { type: 'RESET_WIZARD' };
