import { create } from 'zustand';

interface TrendStore {
  trends: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  } | null;
  loading: boolean;
  fetchTrends: (date?: string) => Promise<void>;
  generateTrends: (cases: any[], targetDateStr?: string) => void;
}

export const useTrendStore = create<TrendStore>((set) => ({
  trends: null,
  loading: false,
  fetchTrends: async (date?: string) => {
    // Dummy function to prevent HMR crashes for old cached components
    console.warn("fetchTrends is deprecated, use generateTrends instead.");
  },
  generateTrends: (cases: any[], targetDateStr?: string) => {
    set({ loading: true });
    try {
      const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
      
      const parseCaseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        let d = new Date();
        
        // Handle DD/MM/YYYY or DD-MM-YYYY
        const separator = dateStr.includes('/') ? '/' : (dateStr.includes('-') && dateStr.split('-')[0].length === 2 ? '-' : null);
        
        if (separator) {
          const parts = dateStr.split(separator);
          if (parts.length === 3) {
             d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
          }
        } else {
          d = new Date(dateStr);
        }
        
        if (isNaN(d.getTime())) {
          // If still invalid, fallback to a safe past date so it gets counted, or just start of today
          const fallback = new Date();
          fallback.setHours(0,0,0,0);
          return fallback;
        }
        return d;
      };

      const getBucket = (cDate: Date, type: 'daily' | 'weekly' | 'monthly') => {
          if (type === 'daily') return cDate.toISOString().split('T')[0];
          if (type === 'weekly') {
              const wDate = new Date(cDate);
              wDate.setDate(wDate.getDate() - wDate.getDay());
              return wDate.toISOString().split('T')[0];
          }
          if (type === 'monthly') return cDate.toISOString().substring(0, 7);
      };

      const computeData = (days: number, type: 'daily' | 'weekly' | 'monthly') => {
         const result = [];
         for (let i = days - 1; i >= 0; i--) {
             const d = new Date(targetDate);
             if (type === 'daily') d.setDate(d.getDate() - i);
             else if (type === 'weekly') d.setDate(d.getDate() - (i * 7));
             else if (type === 'monthly') d.setMonth(d.getMonth() - i);

             // Set to end of the day so any case created ON this day is included
             d.setHours(23, 59, 59, 999);

             const bucketKey = getBucket(d, type);
             
             let active = 0;
             let cleared = 0;
             cases.forEach(c => {
                 const cDate = parseCaseDate(c.date || c.CrimeRegisteredDate);
                 if (getBucket(cDate, type) === bucketKey) {
                     if (c.status === 'Completed' || c.status === 'Closed') {
                         cleared++;
                     } else {
                         active++;
                     }
                 }
             });
             
             let label = bucketKey;
             if (type === 'weekly') label = `Week of ${bucketKey}`;
             if (type === 'monthly') label = d.toLocaleString('default', { month: 'short', year: 'numeric' });

             result.push({
                 date: label,
                 activeCases: active,
                 clearedCases: cleared,
                 newIncidents: cases.filter(c => getBucket(parseCaseDate(c.date || c.CrimeRegisteredDate), type) === bucketKey).length
             });
         }
         return result;
      };

      set({
          trends: {
              daily: computeData(7, 'daily'),
              weekly: computeData(4, 'weekly'),
              monthly: computeData(12, 'monthly')
          },
          loading: false
      });
    } catch (error) {
      console.error('Failed to generate local trends', error);
      set({ loading: false });
    }
  }
}));
