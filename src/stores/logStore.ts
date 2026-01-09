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
    taskEndTime: number | null; // Properly track end time
    addLog: (message: string, level?: LogLevel, imageUrl?: string, promptContent?: string, promptId?: string) => void;
    startTask: (message: string, promptContent?: string, promptId?: string) => string; // Returns log id
    completeTask: (logId: string, message: string, level?: LogLevel, tokens?: TokenInfo, promptContent?: string, promptId?: string) => void;
    setTaskComplete: () => void; // Mark task as complete
    clearLogs: () => void;
    getTaskDuration: () => number;
    getTotalTokens: () => { input: number; output: number };
}

export const useLogStore = create<LogStore>()(
    persist(
        (set, get) => ({
            logs: [],
            taskStartTime: null,
            taskEndTime: null,

            addLog: (message, level = 'info', imageUrl, promptContent, promptId) =>
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
                                promptContent, // Keep for legacy
                                promptId,
                            },
                        ],
                    };
                }),

            startTask: (message, promptContent, promptId) => {
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
                                promptContent, // Keep for legacy
                                promptId,
                            },
                        ],
                    };
                });
                return id;
            },

            completeTask: (logId, message, level = 'success', tokens, promptContent, promptId) =>
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
                                promptId: promptId || log.promptId,
                            }
                            : log
                    ),
                })),

            setTaskComplete: () => set((state) => ({
                taskEndTime: state.taskStartTime ? Date.now() : null,
            })),

            clearLogs: () => set({ logs: [], taskStartTime: null, taskEndTime: null }),

            getTaskDuration: () => {
                const state = get();
                if (!state.taskStartTime) return 0;
                // Use taskEndTime if available, otherwise use current time
                const endTime = state.taskEndTime || Date.now();
                return endTime - state.taskStartTime;
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
                logs: state.logs.map(log => {
                    // We remove promptContent for persistence to save space
                    // But we keep promptId which is small
                    const { promptContent, ...rest } = log;
                    return {
                        ...rest,
                        isRunning: false,
                        promptContent: undefined
                    };
                }),
                taskStartTime: state.taskStartTime,
                taskEndTime: state.taskEndTime,
            }),
        }
    )
);
