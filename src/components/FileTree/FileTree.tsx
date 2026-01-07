import { useCallback, useState } from 'react';
import { FolderOpen, FileCode, FileJson, FileType, X, Plus, GitCompare } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { FileNode } from '../../types';
import './FileTree.css';

// Get icon based on file extension
function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx':
            return <FileCode size={14} className="file-tree-item__icon file-tree-item__icon--ts" />;
        case 'css':
        case 'scss':
            return <FileType size={14} className="file-tree-item__icon file-tree-item__icon--css" />;
        case 'json':
            return <FileJson size={14} className="file-tree-item__icon file-tree-item__icon--json" />;
        default:
            return <FileCode size={14} className="file-tree-item__icon" />;
    }
}

interface FileTreeItemProps {
    file: FileNode;
    isActive: boolean;
    onSelect: (fileId: string) => void;
    onDelete: (fileId: string) => void;
    onCompare: (fileId: string) => void;
}

function FileTreeItem({ file, isActive, onSelect, onDelete, onCompare }: FileTreeItemProps) {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleClick = useCallback(() => {
        if (file.type === 'file') {
            onSelect(file.id);
        }
    }, [file, onSelect]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(file.id);
    }, [file.id, onDelete]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (file.versions && file.versions.length >= 2) {
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
        }
    }, [file.versions]);

    const handleCompareClick = useCallback(() => {
        setShowContextMenu(false);
        onCompare(file.id);
    }, [file.id, onCompare]);

    const handleCloseMenu = useCallback(() => {
        setShowContextMenu(false);
    }, []);

    const hasVersions = file.versions && file.versions.length >= 2;

    if (file.type === 'folder') {
        return (
            <div>
                <div className="file-tree-item">
                    <FolderOpen size={14} className="file-tree-item__icon" />
                    <span className="file-tree-item__name">{file.name}</span>
                </div>
                {file.children?.map((child) => (
                    <div key={child.id} style={{ paddingLeft: 12 }}>
                        <FileTreeItem
                            file={child}
                            isActive={isActive}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onCompare={onCompare}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div
                className={`file-tree-item ${isActive ? 'file-tree-item--active' : ''}`}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                {getFileIcon(file.name)}
                <span className="file-tree-item__name">{file.name}</span>
                {hasVersions && (
                    <span title="有版本记录">
                        <GitCompare size={12} className="file-tree-item__version-badge" />
                    </span>
                )}
                <button className="file-tree-item__delete" onClick={handleDelete} title="删除">
                    <X size={12} />
                </button>
            </div>
            {showContextMenu && (
                <>
                    <div className="file-tree-context-overlay" onClick={handleCloseMenu} />
                    <div
                        className="file-tree-context-menu"
                        style={{ left: menuPosition.x, top: menuPosition.y }}
                    >
                        <button className="file-tree-context-menu__item" onClick={handleCompareClick}>
                            <GitCompare size={14} />
                            版本对比
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

export function FileTree() {
    const { files, activeFileId, openTab, deleteFile, openDiffView, projectSource } = useProjectStore();

    const handleSelectFile = useCallback((fileId: string) => {
        openTab(fileId);
    }, [openTab]);

    const handleDeleteFile = useCallback((fileId: string) => {
        deleteFile(fileId);
    }, [deleteFile]);

    const handleCompareVersions = useCallback((fileId: string) => {
        openDiffView(fileId);
    }, [openDiffView]);

    const handleAddFile = useCallback(() => {
        const fileName = prompt('请输入文件名：', 'NewFile.tsx');
        if (!fileName) return;

        const ext = fileName.split('.').pop()?.toLowerCase() || 'tsx';
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'css': 'css',
            'json': 'json',
        };

        const newFile: FileNode = {
            id: `file-${Date.now()}`,
            name: fileName,
            type: 'file',
            content: '',
            language: languageMap[ext] || 'plaintext',
        };

        useProjectStore.getState().addFile(newFile);
        openTab(newFile.id);
    }, [openTab]);

    return (
        <div className="file-tree">
            <div className="file-tree__header">
                <span className="file-tree__title">
                    文件
                    {files.length > 0 && projectSource === 'history' && (
                        <span className="file-tree__badge file-tree__badge--history">历史记录</span>
                    )}
                </span>
                <div className="file-tree__actions">
                    <button
                        className="file-tree__action-btn"
                        onClick={handleAddFile}
                        title="新建文件"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
            <div className="file-tree__content">
                {files.length === 0 ? (
                    <div className="file-tree__empty">
                        <p>暂无文件</p>
                        <p>生成代码后文件将显示在这里</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <FileTreeItem
                            key={file.id}
                            file={file}
                            isActive={activeFileId === file.id}
                            onSelect={handleSelectFile}
                            onDelete={handleDeleteFile}
                            onCompare={handleCompareVersions}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
