import { create } from 'zustand';
import type { GenerationRecord } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface HistoryRecord extends GenerationRecord { } // Backend and frontend share the same structure

interface HistoryStore {
    records: GenerationRecord[];
    isLoading: boolean;

    // Actions
    fetchHistory: () => Promise<void>;
    addRecord: (record: Omit<GenerationRecord, 'id' | 'timestamp'>) => Promise<void>;
    deleteRecord: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    getRecord: (id: string) => GenerationRecord | undefined;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
    records: [],
    isLoading: false,

    fetchHistory: async () => {
        set({ isLoading: true });
        try {
            const records = await invoke<HistoryRecord[]>('get_history');
            set({ records });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addRecord: async (record) => {
        const newRecord = {
            ...record,
            id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
        };

        // Optimistic update
        set((state) => ({ records: [newRecord as GenerationRecord, ...state.records] }));

        try {
            await invoke('save_history_record', { record: newRecord });
        } catch (error) {
            console.error('Failed to save history record:', error);
            // Revert on failure? Or just log? 
            // For now just log because quota error was the main issue, and backend should handle it better.
        }
    },

    deleteRecord: async (id) => {
        // Optimistic update
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
        try {
            await invoke('delete_history_record', { id });
        } catch (error) {
            console.error('Failed to delete history record:', error);
        }
    },

    clearHistory: async () => {
        set({ records: [] });
        try {
            await invoke('clear_history');
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    },

    getRecord: (id) => {
        return get().records.find((r) => r.id === id);
    },
}));

