import { create } from 'zustand';

interface AppStoreState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
}

const useAppStore = create<AppStoreState>((set) => ({
  isMobile: false,
  setIsMobile: (value: boolean) => set({ isMobile: value }),
}));

export default useAppStore;
