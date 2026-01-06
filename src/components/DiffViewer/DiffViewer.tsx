import { DiffEditor, BeforeMount } from '@monaco-editor/react';
import { X, GitCompare } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import './DiffViewer.css';

// Disable TypeScript diagnostics
const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    });
};

export function DiffViewer() {
    const { diffViewFileId, closeDiffView, getFileById } = useProjectStore();

    if (!diffViewFileId) return null;

    const file = getFileById(diffViewFileId);
    if (!file || !file.versions || file.versions.length < 2) {
        return null;
    }

    const originalVersion = file.versions[0];
    const modifiedVersion = file.versions[file.versions.length - 1];

    return (
        <div className="diff-viewer">
            <div className="diff-viewer__header">
                <div className="diff-viewer__title">
                    <GitCompare size={16} />
                    <span>版本对比 - {file.name}</span>
                </div>
                <div className="diff-viewer__labels">
                    <span className="diff-viewer__label diff-viewer__label--original">
                        {originalVersion.label}
                    </span>
                    <span className="diff-viewer__arrow">→</span>
                    <span className="diff-viewer__label diff-viewer__label--modified">
                        {modifiedVersion.label}
                    </span>
                </div>
                <button className="diff-viewer__close" onClick={closeDiffView}>
                    <X size={16} />
                </button>
            </div>
            <div className="diff-viewer__content">
                <DiffEditor
                    height="100%"
                    language={file.language || 'typescript'}
                    original={originalVersion.content}
                    modified={modifiedVersion.content}
                    theme="vs-light"
                    beforeMount={handleEditorWillMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        readOnly: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        renderSideBySide: true,
                        padding: { top: 16, bottom: 16 },
                    }}
                />
            </div>
        </div>
    );
}
