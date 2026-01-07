import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, LogLevel } from '../types';

interface TokenInfo {
    inputTokens?: number;
    outputTokens?: number;
}

interface LogStore {
    logs: LogEntry[];
    taskStartTime: number | null;
    addLog: (message: string, level?: LogLevel, imageUrl?: string, promptContent?: string) => void;
    startTask: (message: string, promptContent?: string) => string; // Returns log id
    completeTask: (logId: string, message: string, level?: LogLevel, tokens?: TokenInfo, promptContent?: string) => void;
    clearLogs: () => void;
    getTaskDuration: () => number;
    getTotalTokens: () => { input: number; output: number };
}

export const useLogStore = create<LogStore>()(
    persist(
        (set, get) => ({
            logs: [],
            taskStartTime: null,

            addLog: (message, level = 'info', imageUrl, promptContent) =>
                set((state) => {
                    // If this is the first log, start tracking task time
                    const taskStartTime = state.taskStartTime ?? Date.now();
                    return {
                        taskStartTime,
                        logs: [
                            ...state.logs,
                            {
                                id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                timestamp: Date.now(),
                                message,
                                level,
                                imageUrl,
                                promptContent,
                            },
                        ],
                    };
                }),

            startTask: (message, promptContent) => {
                const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                set((state) => {
                    const taskStartTime = state.taskStartTime ?? Date.now();
                    return {
                        taskStartTime,
                        logs: [
                            ...state.logs,
                            {
                                id,
                                timestamp: Date.now(),
                                message,
                                level: 'info',
                                isRunning: true,
                                promptContent,
                            },
                        ],
                    };
                });
                return id;
            },

            completeTask: (logId, message, level = 'success', tokens, promptContent) =>
                set((state) => ({
                    logs: state.logs.map((log) =>
                        log.id === logId
                            ? {
                                ...log,
                                message,
                                level,
                                isRunning: false,
                                duration: Date.now() - log.timestamp,
                                inputTokens: tokens?.inputTokens,
                                outputTokens: tokens?.outputTokens,
                                promptContent: promptContent || log.promptContent,
                            }
                            : log
                    ),
                })),

            clearLogs: () => set({ logs: [], taskStartTime: null }),

            getTaskDuration: () => {
                const state = get();
                if (!state.taskStartTime) return 0;
                return Date.now() - state.taskStartTime;
            },

            getTotalTokens: () => {
                const state = get();
                return state.logs.reduce(
                    (acc, log) => ({
                        input: acc.input + (log.inputTokens || 0),
                        output: acc.output + (log.outputTokens || 0),
                    }),
                    { input: 0, output: 0 }
                );
            },
        }),
        {
            name: 'vcode-logs',
            partialize: (state) => ({
                logs: state.logs.map(log => ({
                    ...log,
                    // Reset isRunning to false - the auto-resume will restart generation
                    isRunning: false,
                })),
                taskStartTime: state.taskStartTime,
            }),
        }
    )
);
