import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimelineEvent {
  id: string | number;
  caseId: string; // Add caseId to link events to cases
  date: string;
  time: string;
  title: string;
  type: 'document' | 'video' | 'alert' | 'image' | 'action' | 'success' | 'warning' | 'info';
  desc: string;
  iconName: string;
  color: string;
  bg: string;
}

interface TimelineState {
  events: TimelineEvent[];
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  removeEvents: (ids: (string | number)[]) => void;
  resetEvents: () => void;
}

const getTodayDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const getTimeMinus = (mins: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const INITIAL_EVENTS: TimelineEvent[] = [
  { id: 1, caseId: 'SYSTEM', date: getTodayDate(), time: getTimeMinus(5), title: 'System Login', type: 'info', desc: 'Super Admin authenticated securely.', iconName: 'Shield', color: 'text-primary', bg: 'bg-primary/20' },
  { id: 2, caseId: 'FIR-2026-089', date: getTodayDate(), time: getTimeMinus(25), title: 'FIR Filed', type: 'alert', desc: 'New FIR filed for Cyber Fraud in Koramangala.', iconName: 'FileText', color: 'text-danger', bg: 'bg-danger/20' },
  { id: 3, caseId: 'SYSTEM', date: getTodayDate(), time: getTimeMinus(42), title: 'AI Subsystem Restart', type: 'warning', desc: 'NLP Engine soft restart completed.', iconName: 'Cpu', color: 'text-warning', bg: 'bg-warning/20' },
  { id: 4, caseId: 'FIR-2026-088', date: getTodayDate(), time: getTimeMinus(120), title: 'Evidence Processed', type: 'success', desc: 'CCTV footage analysis completed. 2 suspects identified.', iconName: 'CheckCircle', color: 'text-success', bg: 'bg-success/20' }
];

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      events: INITIAL_EVENTS,
      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: Date.now() }]
      })),
      removeEvents: (ids) => set((state) => ({
        events: state.events.filter(e => !ids.includes(e.id))
      })),
      resetEvents: () => set({ events: INITIAL_EVENTS }),
    }),
    {
      name: 'rakshak-timeline-store',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          return { ...persistedState, events: INITIAL_EVENTS };
        }
        return persistedState;
      }
    }
  )
);
