import { useRef, useEffect, useState, useMemo } from 'react';
import { X, Activity, Database, ChevronDown, ChevronRight, Zap, Clock, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useLogStore } from '../../stores/logStore';
import './TaskStatisticsDrawer.css';

// Simple time formatter
const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

interface TaskGroup {
    id: string;
    startTime: number;
    logs: any[];
    stats: {
        duration: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        calls: number;
    };
}

export function TaskStatisticsDrawer() {
    const { isDataStatsOpen, setDataStatsOpen } = useUIStore();
    const { apiLogs, clearTaskLogs, clearAllLogs } = useLogStore();
    const drawerRef = useRef<HTMLDivElement>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        clearTaskLogs(taskId);
        if (expandedTasks.has(taskId)) {
            setExpandedTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const handleClearAll = () => {
        if (window.confirm('确定要清空所有任务历史吗？')) {
            clearAllLogs();
            setExpandedTasks(new Set());
        }
    };

    // Group logs by task ID and calculate stats
    const taskGroups = useMemo(() => {
        const groups = new Map<string, TaskGroup>();

        // Process logs
        apiLogs.forEach(log => {
            if (!groups.has(log.taskId)) {
                groups.set(log.taskId, {
                    id: log.taskId,
                    startTime: log.timestamp,
                    logs: [],
                    stats: {
                        duration: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: 0,
                        calls: 0
                    }
                });
            }
            const group = groups.get(log.taskId)!;
            group.logs.push(log);
            group.stats.duration += log.duration;
            group.stats.inputTokens += log.usage.promptTokens;
            group.stats.outputTokens += log.usage.completionTokens;
            group.stats.totalTokens += log.usage.totalTokens;
            group.stats.calls += 1;
            // Update start time (logs are usually appended, so first log might be earliest)
            group.startTime = Math.min(group.startTime, log.timestamp);
        });

        // Convert to array and sort by time descending (newest first)
        const sorted = Array.from(groups.values()).sort((a, b) => b.startTime - a.startTime);
        return sorted.slice(0, 10); // Limit to last 10 tasks
    }, [apiLogs]);

    // Auto-expand the newest task on open if nothing is expanded
    useEffect(() => {
        if (isDataStatsOpen && taskGroups.length > 0) {
            setExpandedTasks(prev => {
                if (prev.size === 0) {
                    return new Set([taskGroups[0].id]);
                }
                return prev;
            });
        }
    }, [isDataStatsOpen, taskGroups]);

    const toggleTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setDataStatsOpen(false);
            }
        };

        if (isDataStatsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDataStatsOpen, setDataStatsOpen]);

    if (!isDataStatsOpen) return null;

    return (
        <div className="stats-drawer__overlay">
            <div className="stats-drawer__container" ref={drawerRef}>
                <div className="stats-drawer__header">
                    <div className="stats-drawer__title">
                        <Activity size={20} />
                        <span>任务模型调用统计</span>
                    </div>
                    <div className="stats-drawer__actions">
                        {taskGroups.length > 0 && (
                            <button
                                className="stats-drawer__clear-btn"
                                onClick={handleClearAll}
                                title="清空历史"
                            >
                                <Trash2 size={14} />
                                <span>清空历史</span>
                            </button>
                        )}
                        <button className="stats-drawer__close" onClick={() => setDataStatsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="stats-drawer__content">
                    <div className="stats-task-list">
                        {taskGroups.length === 0 ? (
                            <div className="stats-empty-state">
                                暂无历史记录
                            </div>
                        ) : (
                            taskGroups.map(task => (
                                <div key={task.id} className="stats-task-group">
                                    <div
                                        className={`stats-group-header ${expandedTasks.has(task.id) ? 'expanded' : ''}`}
                                        onClick={() => toggleTask(task.id)}
                                    >
                                        <div className="stats-group-title">
                                            {expandedTasks.has(task.id) ? (
                                                <ChevronDown size={16} />
                                            ) : (
                                                <ChevronRight size={16} />
                                            )}
                                            <span className="stats-task-id">#{task.id}</span>
                                            <span className="stats-task-time">{formatTime(task.startTime)}</span>
                                        </div>
                                        <div className="stats-group-summary">
                                            <span title="Calls">{task.stats.calls} calls</span>
                                            <span className="separator">•</span>
                                            <span title="Tokens">{task.stats.totalTokens.toLocaleString()} tokens</span>
                                            <button
                                                className="stats-task-delete"
                                                onClick={(e) => handleDeleteTask(e, task.id)}
                                                title="删除记录"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedTasks.has(task.id) && (
                                        <div className="stats-group-body">
                                            {/* Overview Cards for this task */}
                                            <div className="stats-summary-row">
                                                <div className="stats-summary-item" title="总耗时">
                                                    <Clock size={12} className="stats-icon" />
                                                    <span className="stats-label">耗时:</span>
                                                    <span className="stats-value">{(task.stats.duration / 1000).toFixed(2)}s</span>
                                                </div>
                                                <div className="stats-summary-divider"></div>
                                                <div className="stats-summary-item" title="Tokens">
                                                    <span className="stats-label">In/Out:</span>
                                                    <span className="stats-value">{task.stats.inputTokens}/{task.stats.outputTokens}</span>
                                                </div>
                                                <div className="stats-summary-divider"></div>
                                                <div className="stats-summary-item" title="Total Tokens">
                                                    <Zap size={12} className="stats-icon" />
                                                    <span className="stats-label">Total:</span>
                                                    <span className="stats-value">{task.stats.totalTokens}</span>
                                                </div>
                                            </div>

                                            {/* Detailed Logs */}
                                            <div className="stats-list">
                                                {[...task.logs].reverse().map((log) => (
                                                    <div key={log.id} className={`stats-log-item ${log.status}`}>
                                                        <div className="stats-log-header">
                                                            <span className="stats-log-reason">{log.reason}</span>
                                                            <span className="stats-log-time">
                                                                {(log.duration / 1000).toFixed(2)}s
                                                            </span>
                                                        </div>
                                                        <div className="stats-log-url" title={log.url}>{log.url}</div>
                                                        <div className="stats-log-metrics">
                                                            <div className="stats-log-metric metric-input" title="Prompt Tokens">
                                                                <Zap size={10} />
                                                                In: {log.usage.promptTokens}
                                                            </div>
                                                            <div className="stats-log-metric metric-output" title="Completion Tokens">
                                                                <Zap size={10} />
                                                                Out: {log.usage.completionTokens}
                                                            </div>
                                                            <div className="stats-log-metric metric-total" title="Total Tokens">
                                                                <Database size={10} />
                                                                Total: {log.usage.totalTokens}
                                                            </div>
                                                            <div style={{ marginLeft: 'auto', color: 'var(--text-disable)' }}>
                                                                {formatTime(log.timestamp)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
