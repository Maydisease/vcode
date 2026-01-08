import { useCallback, useState, useEffect, useRef } from 'react';
import { FileCode, FileJson, FileType, X, Copy, Trash2, ArrowRightToLine, MinusCircle } from 'lucide-react';
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

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    fileId: string;
}

export function EditorTabs() {
    const {
        openTabs,
        activeFileId,
        setActiveFile,
        closeTab,
        getFileById,
        closeOtherTabs,
        closeAllTabs,
        closeTabsToRight
    } = useProjectStore();

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        fileId: '',
    });

    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.visible]);

    const handleTabClick = useCallback((fileId: string) => {
        setActiveFile(fileId);
    }, [setActiveFile]);

    const handleCloseTab = useCallback((e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        closeTab(fileId);
        // If closing the file associated with context menu, close menu too
        if (contextMenu.fileId === fileId) {
            setContextMenu(prev => ({ ...prev, visible: false }));
        }
    }, [closeTab, contextMenu.fileId]);

    const handleContextMenu = useCallback((e: React.MouseEvent, fileId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            fileId,
        });
        // Optional: switch to the tab being right-clicked? VS Code does this appropriately, but often keeps active one. 
        // Let's NOT switch active tab on right click to mimic VS Code behavior where you can right click inactive tab.
    }, []);

    const copyPath = (fileId: string) => {
        const file = getFileById(fileId);
        if (file) {
            // In this simple app, name is path-like enough, or we construct path if we had folders
            // For now just copy name
            navigator.clipboard.writeText(file.name);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

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
                        onContextMenu={(e) => handleContextMenu(e, tabId)}
                        title={file.name} // Simple tooltip
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

            {contextMenu.visible && (() => {
                // Smart menu: calculate which options are available
                const tabIndex = openTabs.indexOf(contextMenu.fileId);
                const isOnlyTab = openTabs.length === 1;
                const hasTabsToRight = tabIndex < openTabs.length - 1;

                return (
                    <div
                        className="editor-tabs__context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        ref={menuRef}
                    >
                        {/* Close - always available */}
                        <div className="editor-tabs__menu-item" onClick={() => { closeTab(contextMenu.fileId); setContextMenu(prev => ({ ...prev, visible: false })); }}>
                            <X size={14} /> 关闭
                        </div>

                        {/* Close Others - only if more than one tab */}
                        {!isOnlyTab && (
                            <div className="editor-tabs__menu-item" onClick={() => { closeOtherTabs(contextMenu.fileId); setContextMenu(prev => ({ ...prev, visible: false })); }}>
                                <MinusCircle size={14} /> 关闭其他
                            </div>
                        )}

                        {/* Close to Right - only if not rightmost */}
                        {hasTabsToRight && (
                            <div className="editor-tabs__menu-item" onClick={() => { closeTabsToRight(contextMenu.fileId); setContextMenu(prev => ({ ...prev, visible: false })); }}>
                                <ArrowRightToLine size={14} /> 关闭右侧
                            </div>
                        )}

                        {/* Separator - only show if there are close options above */}
                        {!isOnlyTab && <div className="editor-tabs__menu-separator" />}

                        {/* Close All - only if more than one tab (otherwise same as Close) */}
                        {!isOnlyTab && (
                            <div className="editor-tabs__menu-item editor-tabs__menu-item--danger" onClick={() => { closeAllTabs(); setContextMenu(prev => ({ ...prev, visible: false })); }}>
                                <Trash2 size={14} /> 关闭全部
                            </div>
                        )}

                        <div className="editor-tabs__menu-separator" />
                        <div className="editor-tabs__menu-item editor-tabs__menu-item--primary" onClick={() => copyPath(contextMenu.fileId)}>
                            <Copy size={14} /> 复制文件名
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
