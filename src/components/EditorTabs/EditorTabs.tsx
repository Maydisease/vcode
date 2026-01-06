import { useCallback } from 'react';
import { FileCode, FileJson, FileType, X } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import './EditorTabs.css';

// Get icon based on file extension
function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx':
            return <FileCode size={12} className="editor-tabs__tab-icon editor-tabs__tab-icon--ts" />;
        case 'css':
        case 'scss':
            return <FileType size={12} className="editor-tabs__tab-icon editor-tabs__tab-icon--css" />;
        case 'json':
            return <FileJson size={12} className="editor-tabs__tab-icon editor-tabs__tab-icon--json" />;
        default:
            return <FileCode size={12} className="editor-tabs__tab-icon" />;
    }
}

export function EditorTabs() {
    const { openTabs, activeFileId, setActiveFile, closeTab, getFileById } = useProjectStore();

    const handleTabClick = useCallback((fileId: string) => {
        setActiveFile(fileId);
    }, [setActiveFile]);

    const handleCloseTab = useCallback((e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        closeTab(fileId);
    }, [closeTab]);

    if (openTabs.length === 0) {
        return (
            <div className="editor-tabs">
                <div className="editor-tabs__empty">暂无打开的文件</div>
            </div>
        );
    }

    return (
        <div className="editor-tabs">
            {openTabs.map((tabId) => {
                const file = getFileById(tabId);
                if (!file) return null;

                return (
                    <div
                        key={tabId}
                        className={`editor-tabs__tab ${activeFileId === tabId ? 'editor-tabs__tab--active' : ''}`}
                        onClick={() => handleTabClick(tabId)}
                    >
                        {getFileIcon(file.name)}
                        <span className="editor-tabs__tab-name">{file.name}</span>
                        <button
                            className="editor-tabs__tab-close"
                            onClick={(e) => handleCloseTab(e, tabId)}
                            title="关闭"
                        >
                            <X size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
