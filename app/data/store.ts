// lib/store.ts
import { create } from 'zustand';

interface Store {
  appData: Object;
  setAppData: (value: Object) => void;
}

export const useGlobalStore = create<Store>((set) => ({
  appData: {},
  setAppData: (value) => set({ appData: value }),
}));