import { create } from 'zustand';

type SidePanelTab = 'log' | 'history';

interface UIStore {
    sidePanelTab: SidePanelTab;
    setSidePanelTab: (tab: SidePanelTab) => void;
    // Task Statistics Drawer
    isDataStatsOpen: boolean;
    setDataStatsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidePanelTab: 'log',
    setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
    isDataStatsOpen: false,
    setDataStatsOpen: (open) => set({ isDataStatsOpen: open }),
}));
