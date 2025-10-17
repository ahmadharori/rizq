import { useReducer, useCallback } from 'react';
import type { WizardState, WizardAction, WizardStep } from '@/types/wizard';

const initialState: WizardState = {
  currentStep: 1,
  viewMode: 'all',
  selectedRecipientIds: [],
  assignmentMode: 'rekomendasi',
  manualGroups: [],
  capacityPerCourier: null,
  selectedCourierIds: [],
  assignments: [],
  recipients: [],
  couriers: [],
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'SET_ASSIGNMENT_MODE':
      return { ...state, assignmentMode: action.mode };

    case 'TOGGLE_RECIPIENT':
      return {
        ...state,
        selectedRecipientIds: state.selectedRecipientIds.includes(action.recipientId)
          ? state.selectedRecipientIds.filter(id => id !== action.recipientId)
          : [...state.selectedRecipientIds, action.recipientId]
      };

    case 'SELECT_ALL_RECIPIENTS':
      return {
        ...state,
        selectedRecipientIds: state.recipients
          .filter(r => r.status === 'Unassigned')
          .map(r => r.id)
      };

    case 'DESELECT_ALL_RECIPIENTS':
      return { ...state, selectedRecipientIds: [] };

    case 'SET_CAPACITY':
      return { ...state, capacityPerCourier: action.capacity };

    case 'ADD_MANUAL_GROUP':
      return {
        ...state,
        manualGroups: [...state.manualGroups, action.group]
      };

    case 'REMOVE_MANUAL_GROUP':
      return {
        ...state,
        manualGroups: state.manualGroups.filter(g => g.id !== action.groupId)
      };

    case 'UPDATE_MANUAL_GROUP':
      return {
        ...state,
        manualGroups: state.manualGroups.map(g =>
          g.id === action.groupId ? { ...g, ...action.group } : g
        )
      };

    case 'TOGGLE_COURIER':
      return {
        ...state,
        selectedCourierIds: state.selectedCourierIds.includes(action.courierId)
          ? state.selectedCourierIds.filter(id => id !== action.courierId)
          : [...state.selectedCourierIds, action.courierId]
      };

    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.assignments };

    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === action.assignmentId ? { ...a, ...action.assignment } : a
        )
      };

    case 'SET_RECIPIENTS':
      return { ...state, recipients: action.recipients };

    case 'SET_COURIERS':
      return { ...state, couriers: action.couriers };

    case 'RESET_WIZARD':
      return initialState;

    default:
      return state;
  }
}

export const useWizardState = () => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const actions = {
    setStep: useCallback((step: WizardStep) => {
      dispatch({ type: 'SET_STEP', step });
    }, []),

    setViewMode: useCallback((mode: 'all' | 'city') => {
      dispatch({ type: 'SET_VIEW_MODE', mode });
    }, []),

    setAssignmentMode: useCallback((mode: 'manual' | 'rekomendasi') => {
      dispatch({ type: 'SET_ASSIGNMENT_MODE', mode });
    }, []),

    toggleRecipient: useCallback((recipientId: string) => {
      dispatch({ type: 'TOGGLE_RECIPIENT', recipientId });
    }, []),

    selectAllRecipients: useCallback(() => {
      dispatch({ type: 'SELECT_ALL_RECIPIENTS' });
    }, []),

    deselectAllRecipients: useCallback(() => {
      dispatch({ type: 'DESELECT_ALL_RECIPIENTS' });
    }, []),

    setCapacity: useCallback((capacity: number | null) => {
      dispatch({ type: 'SET_CAPACITY', capacity });
    }, []),

    addManualGroup: useCallback((group: WizardState['manualGroups'][0]) => {
      dispatch({ type: 'ADD_MANUAL_GROUP', group });
    }, []),

    removeManualGroup: useCallback((groupId: string) => {
      dispatch({ type: 'REMOVE_MANUAL_GROUP', groupId });
    }, []),

    updateManualGroup: useCallback((groupId: string, group: Partial<WizardState['manualGroups'][0]>) => {
      dispatch({ type: 'UPDATE_MANUAL_GROUP', groupId, group });
    }, []),

    toggleCourier: useCallback((courierId: string) => {
      dispatch({ type: 'TOGGLE_COURIER', courierId });
    }, []),

    setAssignments: useCallback((assignments: WizardState['assignments']) => {
      dispatch({ type: 'SET_ASSIGNMENTS', assignments });
    }, []),

    updateAssignment: useCallback((assignmentId: string, assignment: Partial<WizardState['assignments'][0]>) => {
      dispatch({ type: 'UPDATE_ASSIGNMENT', assignmentId, assignment });
    }, []),

    setRecipients: useCallback((recipients: WizardState['recipients']) => {
      dispatch({ type: 'SET_RECIPIENTS', recipients });
    }, []),

    setCouriers: useCallback((couriers: WizardState['couriers']) => {
      dispatch({ type: 'SET_COURIERS', couriers });
    }, []),

    resetWizard: useCallback(() => {
      dispatch({ type: 'RESET_WIZARD' });
    }, []),

    // Navigation helpers
    nextStep: useCallback(() => {
      dispatch({ type: 'SET_STEP', step: Math.min(state.currentStep + 1, 4) as WizardStep });
    }, [state.currentStep]),

    previousStep: useCallback(() => {
      dispatch({ type: 'SET_STEP', step: Math.max(state.currentStep - 1, 1) as WizardStep });
    }, [state.currentStep]),
  };

  return { state, actions, dispatch };
};
