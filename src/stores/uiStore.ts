import { create } from 'zustand';

type SidePanelTab = 'log' | 'history';

interface UIStore {
    sidePanelTab: SidePanelTab;
    setSidePanelTab: (tab: SidePanelTab) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidePanelTab: 'log',
    setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
}));
