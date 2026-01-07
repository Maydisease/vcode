import { useCallback, useState } from 'react';
import { History, Code2, Trash2 } from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { formatDuration } from '../WorkLog/WorkLog';
import type { GenerationRecord } from '../../types';
import './HistoryList.css';

interface HistoryListProps {
    onRestore: (code: string) => void;
}

export function HistoryList({ onRestore }: HistoryListProps) {
    const { records, deleteRecord } = useHistoryStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleRestore = useCallback((record: GenerationRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        onRestore(record.generatedCode);
    }, [onRestore]);

    const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteRecord(id);
    }, [deleteRecord]);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - timestamp;

        // Less than 24 hours
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    };

    return (
        <div className="history-list">
            {/* Header removed and merged into SidePanel */}

            <div className="history-list__content">
                {records.length === 0 ? (
                    <div className="history-list__empty">
                        <History size={40} strokeWidth={1.5} />
                        <span className="history-list__empty-title">暂无历史记录</span>
                        <span className="history-list__empty-desc">生成代码后会自动保存</span>
                    </div>
                ) : (
                    <div className="history-list__items">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className={`history-item ${selectedId === record.id ? 'history-item--selected' : ''}`}
                                onClick={() => {
                                    setSelectedId(record.id);
                                    onRestore(record.generatedCode);
                                }}
                            >
                                <div className="history-item__header">
                                    <span className={`history-item__mode history-item__mode--${record.mode}`}>
                                        {record.mode === 'easyform' ? 'EasyForm' : '通用'}
                                    </span>
                                    <span className="history-item__time">{formatTime(record.timestamp)}</span>
                                </div>

                                <div className="history-item__summary">
                                    {record.promptSummary || '无描述'}
                                </div>

                                <div className="history-item__footer">
                                    <div className="history-item__stats">
                                        <span className="history-item__model">{record.modelUsed}</span>
                                        {record.duration && (
                                            <span className="history-item__duration">{formatDuration(record.duration)}</span>
                                        )}
                                    </div>
                                    <div className="history-item__actions">
                                        <button
                                            className="history-item__action-btn"
                                            onClick={(e) => handleRestore(record, e)}
                                            title="恢复代码"
                                        >
                                            <Code2 size={14} />
                                        </button>
                                        <button
                                            className="history-item__action-btn history-item__action-btn--delete"
                                            onClick={(e) => handleDelete(record.id, e)}
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
