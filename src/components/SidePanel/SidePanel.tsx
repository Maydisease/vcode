import { useState } from 'react';
import { Trash2, FileText, History } from 'lucide-react';
import { WorkLog } from '../WorkLog/WorkLog';
import { HistoryList } from './HistoryList';
import { useProjectStore } from '../../stores/projectStore';
import { useGeneratorStore } from '../../stores/generatorStore';
import { useLogStore } from '../../stores/logStore';
import { useHistoryStore } from '../../stores/historyStore';
import './SidePanel.css';

interface SidePanelProps {
    onRestoreCode: (code: string) => void;
}

type TabId = 'log' | 'history';

export function SidePanel({ onRestoreCode }: SidePanelProps) {
    const [activeTab, setActiveTab] = useState<TabId>('log');
    const { logs, clearLogs } = useLogStore();
    const { records, clearHistory } = useHistoryStore();

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        if (tab === 'log') {
            useProjectStore.getState().setFiles([]);
            useGeneratorStore.getState().setGeneratedCode('');
            useProjectStore.getState().setProjectSource('generator');
        }
    };

    const handleRestore = (code: string) => {
        onRestoreCode(code);
        useProjectStore.getState().setProjectSource('history');
    };

    return (
        <div className="side-panel">
            <div className="side-panel__tabs">
                <button
                    className={`side-panel__tab ${activeTab === 'log' ? 'side-panel__tab--active' : ''}`}
                    onClick={() => handleTabChange('log')}
                >
                    <FileText size={14} />
                    工作日志
                </button>
                <button
                    className={`side-panel__tab ${activeTab === 'history' ? 'side-panel__tab--active' : ''}`}
                    onClick={() => handleTabChange('history')}
                >
                    <History size={14} />
                    生成历史
                </button>

                <div style={{ flex: 1 }} />

                {activeTab === 'log' && logs.length > 0 && (
                    <button className="side-panel__action-btn" onClick={clearLogs} title="清空日志">
                        <Trash2 size={14} />
                    </button>
                )}
                {activeTab === 'history' && records.length > 0 && (
                    <button className="side-panel__action-btn" onClick={clearHistory} title="清空历史">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            <div className="side-panel__content">
                {activeTab === 'log' ? (
                    <WorkLog />
                ) : (
                    <HistoryList onRestore={handleRestore} />
                )}
            </div>
        </div>
    );
}
