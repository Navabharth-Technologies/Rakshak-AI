import { create } from 'zustand';

export interface PatrolUnit {
  id: number;
  name: string;
  lat: number;
  lng: number;
  risk: 'Critical' | 'High' | 'Medium';
  type: string;
  radius: number;
  cases: number;
  prediction: string;
  actions: string[];
  location: string;
}

interface DigitalTwinState {
  patrolUnits: PatrolUnit[];
  criminalNetworks: any[];
  deployedActions: Record<number, string[]>;
  addPatrolUnit: (unit: PatrolUnit) => void;
  removePatrolUnit: (id: number) => void;
  addCriminalNetwork: (network: any) => void;
  removeCriminalNetwork: (id: number) => void;
  addDeployedAction: (id: number, action: string) => void;
}

export const useDigitalTwinStore = create<DigitalTwinState>((set) => ({
  patrolUnits: [],
  criminalNetworks: [],
  deployedActions: {},
  addPatrolUnit: (unit) => set((state) => ({ patrolUnits: [...state.patrolUnits, unit] })),
  removePatrolUnit: (id) => set((state) => ({ patrolUnits: state.patrolUnits.filter(u => u.id !== id) })),
  addCriminalNetwork: (network) => set((state) => ({ criminalNetworks: [...state.criminalNetworks, network] })),
  removeCriminalNetwork: (id) => set((state) => ({ criminalNetworks: state.criminalNetworks.filter(n => n.id !== id) })),
  addDeployedAction: (id, action) => set((state) => {
    const existing = state.deployedActions[id] || [];
    if (existing.includes(action)) return state;
    return {
      deployedActions: {
        ...state.deployedActions,
        [id]: [...existing, action]
      }
    };
  }),
}));
