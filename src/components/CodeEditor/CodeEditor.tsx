import { useState, useCallback } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import { Code2, Copy, Check, Download, Package } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { FileTree } from '../FileTree/FileTree';
import { EditorTabs } from '../EditorTabs/EditorTabs';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import './CodeEditor.css';

// Disable TypeScript diagnostics (syntax errors, type errors)
const handleEditorWillMount: BeforeMount = (monaco) => {
    // Disable TypeScript validation
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    });

    // Also disable for JavaScript in case the code is detected as JS
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    });
};

export function CodeEditor() {
    const [copied, setCopied] = useState(false);
    const { files, activeFileId, diffViewFileId, getActiveFile, updateFileContent } = useProjectStore();

    const activeFile = getActiveFile();
    const hasFiles = files.length > 0;

    const handleCopy = useCallback(async () => {
        if (!activeFile?.content) return;

        try {
            await navigator.clipboard.writeText(activeFile.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }, [activeFile]);

    const handleDownload = useCallback(() => {
        if (!activeFile?.content) return;

        const blob = new Blob([activeFile.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [activeFile]);

    const handleDownloadAll = useCallback(() => {
        // Create a simple concatenated file for now
        // TODO: Implement proper ZIP download
        const allContent = files
            .filter(f => f.type === 'file')
            .map(f => `// ===== ${f.name} =====\n${f.content}\n`)
            .join('\n');

        const blob = new Blob([allContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-code.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [files]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value !== undefined && activeFileId) {
            updateFileContent(activeFileId, value);
        }
    }, [activeFileId, updateFileContent]);

    return (
        <div className="code-editor code-editor--multi-file">
            <div className="code-editor__sidebar">
                <FileTree />
            </div>
            <div className="code-editor__main">
                <div className="code-editor__header">
                    <div className="code-editor__title">
                        <Code2 size={16} />
                        <span>代码编辑器</span>
                    </div>
                    {hasFiles && (
                        <div className="code-editor__actions">
                            <button
                                className={`code-editor__action-btn ${copied ? 'code-editor__action-btn--copied' : ''}`}
                                onClick={handleCopy}
                                disabled={!activeFile}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? '已复制' : '复制'}
                            </button>
                            <button
                                className="code-editor__action-btn"
                                onClick={handleDownload}
                                disabled={!activeFile}
                            >
                                <Download size={14} />
                                下载
                            </button>
                            {files.length > 1 && (
                                <button className="code-editor__action-btn" onClick={handleDownloadAll}>
                                    <Package size={14} />
                                    全部
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <EditorTabs />
                <div className="code-editor__content">
                    {diffViewFileId ? (
                        <DiffViewer />
                    ) : activeFile ? (
                        <Editor
                            height="100%"
                            language={activeFile.language || 'typescript'}
                            value={activeFile.content || ''}
                            onChange={handleEditorChange}
                            beforeMount={handleEditorWillMount}
                            theme="vs-light"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                tabSize: 2,
                                renderLineHighlight: 'line',
                                padding: { top: 16, bottom: 16 },
                            }}
                        />
                    ) : (
                        <div className="code-editor__empty">
                            <div className="code-editor__empty-icon">
                                <Code2 size={48} />
                            </div>
                            <div className="code-editor__empty-text">
                                <p>上传设计图并点击"生成代码"</p>
                                <p>生成的代码将显示在这里</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
