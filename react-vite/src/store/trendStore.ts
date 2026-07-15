import { create } from 'zustand';
import axios from 'axios';

interface TrendStore {
  trends: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  } | null;
  loading: boolean;
  fetchTrends: () => Promise<void>;
}

export const useTrendStore = create<TrendStore>((set) => ({
  trends: null,
  loading: false,
  fetchTrends: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/server/rakshak_function/api/trends');
      if (res.data) {
        set({ trends: res.data, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch trends from backend', error);
      set({ loading: false });
    }
  }
}));
