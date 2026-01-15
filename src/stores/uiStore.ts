import { create } from 'zustand';
import { Update } from '@tauri-apps/plugin-updater';

type SidePanelTab = 'log' | 'history';

interface UIStore {
    sidePanelTab: SidePanelTab;
    setSidePanelTab: (tab: SidePanelTab) => void;
    // Task Statistics Drawer
    isDataStatsOpen: boolean;
    setDataStatsOpen: (open: boolean) => void;

    // Update Modal
    updateModal: {
        isOpen: boolean;
        status: 'checking' | 'available' | 'uptodate' | 'error' | 'downloaded';
        versionInfo: { current: string; new?: string; body?: string } | null;
        updateHandle: Update | null;
    };
    openUpdateModal: (currentVersion: string) => void;
    setUpdateStatus: (status: 'available' | 'uptodate' | 'error' | 'downloaded', info?: { new: string; body?: string }, handle?: Update) => void;
    closeUpdateModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidePanelTab: 'log',
    setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
    isDataStatsOpen: false,
    setDataStatsOpen: (open) => set({ isDataStatsOpen: open }),

    updateModal: {
        isOpen: false,
        status: 'checking',
        versionInfo: null,
        updateHandle: null,
    },
    openUpdateModal: (currentVersion) =>
        set({
            updateModal: {
                isOpen: true,
                status: 'checking',
                versionInfo: { current: currentVersion },
                updateHandle: null
            }
        }),
    setUpdateStatus: (status, info, handle) =>
        set((state) => ({
            updateModal: {
                ...state.updateModal,
                status,
                versionInfo: state.updateModal.versionInfo ? { ...state.updateModal.versionInfo, ...info } : null,
                updateHandle: handle || null
            }
        })),
    closeUpdateModal: () =>
        set((state) => ({ updateModal: { ...state.updateModal, isOpen: false } })),
}));
