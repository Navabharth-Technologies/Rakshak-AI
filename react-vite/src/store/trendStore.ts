import { create } from 'zustand';

interface TrendStore {
  trends: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  } | null;
  loading: boolean;
  generateTrends: (cases: any[], targetDateStr?: string) => void;
}

export const useTrendStore = create<TrendStore>((set) => ({
  trends: null,
  loading: false,
  generateTrends: (cases: any[], targetDateStr?: string) => {
    set({ loading: true });
    try {
      const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
      
      const parseCaseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          // en-IN is DD/MM/YYYY
          if (parts.length === 3) {
             return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
          }
        }
        return new Date(dateStr);
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

             const bucketKey = getBucket(d, type);
             
             let active = 0;
             let cleared = 0;
             cases.forEach(c => {
                 const cDate = parseCaseDate(c.date || c.CrimeRegisteredDate);
                 if (cDate <= d) {
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
