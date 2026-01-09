import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, LogLevel } from '../types';

interface TokenInfo {
    inputTokens?: number;
    outputTokens?: number;
}

interface ApiLogEntry {
    id: string;
    taskId: string;
    url: string;
    reason: string;
    status: 'success' | 'failed';
    duration: number;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    timestamp: number;
}

interface LogStore {
    logs: LogEntry[];
    taskStartTime: number | null;
    taskEndTime: number | null;

    // Task Tracking
    currentTaskId: string | null;
    apiLogs: ApiLogEntry[];

    addLog: (message: string, level?: LogLevel, imageUrl?: string, promptContent?: string, promptId?: string) => void;
    startTask: (message: string, promptContent?: string, promptId?: string) => string;
    completeTask: (logId: string, message: string, level?: LogLevel, tokens?: TokenInfo, promptContent?: string, promptId?: string) => void;
    setTaskComplete: () => void;
    clearLogs: () => void;
    getTaskDuration: () => number;
    getTotalTokens: () => { input: number; output: number };

    // New API Tracking Actions
    initTaskId: () => string;
    addApiLog: (log: Omit<ApiLogEntry, 'id' | 'timestamp' | 'taskId'>) => void;
    clearApiLogs: () => void;
    clearTaskLogs: (taskId: string) => void;
    clearAllLogs: () => void;
}

export const useLogStore = create<LogStore>()(
    persist(
        (set, get) => ({
            logs: [],
            taskStartTime: null,
            taskEndTime: null,
            currentTaskId: null,
            apiLogs: [],

            addLog: (message, level = 'info', imageUrl, promptContent, promptId) =>
                set((state) => {
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
                                promptContent,
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

            // --- New Actions Implementation ---

            initTaskId: () => {
                const taskId = Math.random().toString(36).substring(2, 10);
                set({ currentTaskId: taskId });
                return taskId;
            },

            addApiLog: (log) => set((state) => {
                const taskId = state.currentTaskId || Math.random().toString(36).substring(2, 10);
                return {
                    currentTaskId: taskId,
                    apiLogs: [
                        ...state.apiLogs,
                        {
                            ...log,
                            id: Math.random().toString(36).substring(2, 9),
                            timestamp: Date.now(),
                            taskId: taskId,
                        }
                    ]
                };
            }),

            clearApiLogs: () => set({ apiLogs: [] }),

            clearTaskLogs: (taskId: string) => set((state) => ({
                apiLogs: state.apiLogs.filter(log => log.taskId !== taskId)
            })),

            clearAllLogs: () => set({ apiLogs: [] }),
        }),
        {
            name: 'vcode-logs',
            partialize: (state) => ({
                logs: state.logs.map(log => {
                    const { promptContent, ...rest } = log;
                    return {
                        ...rest,
                        isRunning: false,
                        promptContent: undefined
                    };
                }),
                taskStartTime: state.taskStartTime,
                taskEndTime: state.taskEndTime,
                // Persist new fields
                currentTaskId: state.currentTaskId,
                apiLogs: state.apiLogs,
            }),
        }
    )
);
