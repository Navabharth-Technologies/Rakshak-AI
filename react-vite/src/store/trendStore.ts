import { create } from 'zustand';
import axios from 'axios';

interface TrendStore {
  trends: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  } | null;
  loading: boolean;
  fetchTrends: (date?: string) => Promise<void>;
}

export const useTrendStore = create<TrendStore>((set) => ({
  trends: null,
  loading: false,
  fetchTrends: async (date?: string) => {
    set({ loading: true });
    try {
      const url = date ? `/server/rakshak_function/api/trends?date=${date}` : '/server/rakshak_function/api/trends';
      const res = await axios.get(url);
      if (res.data) {
        set({ trends: res.data, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch trends from backend', error);
      set({ loading: false });
    }
  }
}));
