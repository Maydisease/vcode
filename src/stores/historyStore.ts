import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GenerationRecord } from '../types';

const MAX_HISTORY_ITEMS = 50; // Limit history to prevent storage bloat

interface HistoryStore {
    records: GenerationRecord[];

    // Actions
    addRecord: (record: Omit<GenerationRecord, 'id' | 'timestamp'>) => void;
    deleteRecord: (id: string) => void;
    clearHistory: () => void;
    getRecord: (id: string) => GenerationRecord | undefined;
}

export const useHistoryStore = create<HistoryStore>()(
    persist(
        (set, get) => ({
            records: [],

            addRecord: (record) => {
                const newRecord: GenerationRecord = {
                    ...record,
                    id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    timestamp: Date.now(),
                };

                set((state) => {
                    // Add new record at the beginning, limit total count
                    const updatedRecords = [newRecord, ...state.records].slice(0, MAX_HISTORY_ITEMS);
                    return { records: updatedRecords };
                });
            },

            deleteRecord: (id) => {
                set((state) => ({
                    records: state.records.filter((r) => r.id !== id),
                }));
            },

            clearHistory: () => {
                set({ records: [] });
            },

            getRecord: (id) => {
                return get().records.find((r) => r.id === id);
            },
        }),
        {
            name: 'vcode-history-storage',
            version: 1,
        }
    )
);
