import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Code2, Copy, Check, Download, Package, Save, History, ChevronDown } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useFormConfigEditorStore } from '../../stores/formConfigEditorStore';
import { FileTree } from '../FileTree/FileTree';
import { EditorTabs } from '../EditorTabs/EditorTabs';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { FormConfigEditor } from '../FormConfigEditor/FormConfigEditor';
import { saveToFile } from '../../services/exportService';
import { toast } from '../Toast/Toast';
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
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const { codeRange } = useFormConfigEditorStore();
    const decorationsRef = useRef<string[]>([]);
    const codeLensProviderRef = useRef<Monaco.IDisposable | null>(null);
    const commandDisposableRef = useRef<Monaco.IDisposable | null>(null);

    // Dropdown menu state
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setIsDownloadMenuOpen(false);
            }
        };

        if (isDownloadMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDownloadMenuOpen]);

    const activeFile = getActiveFile();
    const hasFiles = files.length > 0;

    // Cleanup global Monaco resources on unmount
    useEffect(() => {
        return () => {
            if (codeLensProviderRef.current) {
                codeLensProviderRef.current.dispose();
            }
            if (commandDisposableRef.current) {
                commandDisposableRef.current.dispose();
            }
        };
    }, []);

    // Handle saving FormConfig changes back to the editor
    const handleFormConfigSave = useCallback((newArrayCode: string) => {
        const editor = editorRef.current;
        const range = codeRange;
        if (!editor || !range) return;

        const model = editor.getModel();
        if (!model) return;

        // Replace the code in the editor
        editor.executeEdits('formConfigEditor', [{
            range: new (window as any).monaco.Range(
                range.startLine,
                range.startColumn,
                range.endLine,
                range.endColumn
            ),
            text: newArrayCode,
        }]);

        toast.success('配置已保存');
    }, [codeRange]);

    const handleCopy = useCallback(async () => {
        if (!activeFile?.content) return;

        try {
            await navigator.clipboard.writeText(activeFile.content);
            setCopied(true);
            toast.success(`已复制: ${activeFile.name}`);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('复制失败');
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
        toast.success(`已下载: ${activeFile.name}`);
    }, [activeFile]);

    const handleSaveToFile = useCallback(async () => {
        if (!activeFile?.content) return;
        await saveToFile(activeFile.content, activeFile.name);
    }, [activeFile]);

    const handleDownloadAll = useCallback(() => {
        // Create a simple concatenated file for now
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
        toast.success('已下载全部代码');
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
                        {activeFileId && useProjectStore.getState().projectSource === 'history' && (
                            <span className="code-editor__badge code-editor__badge--history" title="历史记录">
                                <History size={12} />
                            </span>
                        )}
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


                            <div className="code-editor__split-btn-group" ref={downloadMenuRef}>
                                <button
                                    className="code-editor__action-btn code-editor__split-main"
                                    onClick={handleDownload}
                                    disabled={!activeFile}
                                    title="下载当前文件"
                                >
                                    <Download size={14} />
                                    下载
                                </button>
                                <button
                                    className={`code-editor__action-btn code-editor__split-trigger ${isDownloadMenuOpen ? 'active' : ''}`}
                                    onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                                    disabled={!activeFile}
                                >
                                    <ChevronDown size={12} />
                                </button>

                                {isDownloadMenuOpen && (
                                    <div className="code-editor__dropdown-menu">
                                        <button
                                            className="code-editor__dropdown-item"
                                            onClick={() => {
                                                handleSaveToFile();
                                                setIsDownloadMenuOpen(false);
                                            }}
                                            disabled={!activeFile}
                                        >
                                            <Save size={14} />
                                            另存为...
                                        </button>
                                        {files.length > 1 && (
                                            <button
                                                className="code-editor__dropdown-item"
                                                onClick={() => {
                                                    handleDownloadAll();
                                                    setIsDownloadMenuOpen(false);
                                                }}
                                            >
                                                <Package size={14} />
                                                下载全部
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
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
                            onMount={(editor, monaco) => {
                                // Save editor reference
                                editorRef.current = editor;

                                // 1. Action: Select Code Block
                                editor.addAction({
                                    id: 'select-code-block',
                                    label: '选中代码块',
                                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyB],
                                    contextMenuGroupId: 'navigation',
                                    contextMenuOrder: 1,
                                    run: async (ed) => {
                                        const model = ed.getModel();
                                        if (!model) return;
                                        const position = ed.getPosition();
                                        if (!position) return;
                                        const offset = model.getOffsetAt(position);
                                        const code = model.getValue();

                                        const { findFormConfigByType, findCodeBlockAtPosition } = await import('../../utils/astUtils');
                                        const { parseFormConfigCode } = await import('../../utils/codeGenerator');

                                        // Try FormConfig first
                                        const formConfig = findFormConfigByType(code, offset);
                                        if (formConfig) {
                                            const startPos = model.getPositionAt(formConfig.statementStart);
                                            const endPos = model.getPositionAt(formConfig.statementEnd);
                                            ed.setSelection({
                                                startLineNumber: startPos.lineNumber,
                                                startColumn: startPos.column,
                                                endLineNumber: endPos.lineNumber,
                                                endColumn: endPos.column,
                                            });
                                            ed.revealLineInCenter(startPos.lineNumber);

                                            const fields = parseFormConfigCode(formConfig.text);
                                            useFormConfigEditorStore.getState().open({
                                                fields,
                                                variableName: formConfig.name,
                                                typeName: formConfig.typeName,
                                                codeRange: {
                                                    startLine: model.getPositionAt(formConfig.valueStart).lineNumber,
                                                    startColumn: model.getPositionAt(formConfig.valueStart).column,
                                                    endLine: model.getPositionAt(formConfig.valueEnd).lineNumber,
                                                    endColumn: model.getPositionAt(formConfig.valueEnd).column,
                                                },
                                                originalCode: formConfig.text,
                                            });
                                            return;
                                        }

                                        // Fallback
                                        const block = findCodeBlockAtPosition(code, offset);
                                        if (block) {
                                            const startPos = model.getPositionAt(block.valueStart);
                                            const endPos = model.getPositionAt(block.valueEnd);
                                            ed.setSelection({
                                                startLineNumber: startPos.lineNumber,
                                                startColumn: startPos.column,
                                                endLineNumber: endPos.lineNumber,
                                                endColumn: endPos.column,
                                            });
                                            ed.revealLineInCenter(startPos.lineNumber);
                                            toast.success(`已选中: ${block.name} (${block.type})`);
                                        } else {
                                            toast.info('当前位置没有可识别的代码块');
                                        }
                                    }
                                });

                                // 2. CodeLens & Highlight
                                const commandId = 'openFormConfigEditor_' + Date.now();
                                if (commandDisposableRef.current) {
                                    commandDisposableRef.current.dispose();
                                }
                                commandDisposableRef.current = monaco.editor.registerCommand(commandId, async (_accessor: any, formConfig: any) => {
                                    if (!formConfig) return;
                                    const { parseFormConfigCode } = await import('../../utils/codeGenerator');
                                    const model = editor.getModel();
                                    if (!model) return;

                                    const fields = parseFormConfigCode(formConfig.text);
                                    useFormConfigEditorStore.getState().open({
                                        fields,
                                        variableName: formConfig.name,
                                        typeName: formConfig.typeName,
                                        codeRange: {
                                            startLine: model.getPositionAt(formConfig.valueStart).lineNumber,
                                            startColumn: model.getPositionAt(formConfig.valueStart).column,
                                            endLine: model.getPositionAt(formConfig.valueEnd).lineNumber,
                                            endColumn: model.getPositionAt(formConfig.valueEnd).column,
                                        },
                                        originalCode: formConfig.text,
                                    });
                                });

                                const updateFeatures = async () => {
                                    const model = editor.getModel();
                                    if (!model) return;
                                    const code = model.getValue();
                                    const { findAllFormConfigs } = await import('../../utils/astUtils');
                                    const configs = findAllFormConfigs(code);

                                    // Decorations
                                    const newDecorations: Monaco.editor.IModelDeltaDecoration[] = configs.map(config => ({
                                        range: {
                                            startLineNumber: model.getPositionAt(config.valueStart).lineNumber,
                                            startColumn: model.getPositionAt(config.valueStart).column,
                                            endLineNumber: model.getPositionAt(config.valueEnd).lineNumber,
                                            endColumn: model.getPositionAt(config.valueEnd).column,
                                        },
                                        options: {
                                            isWholeLine: false,
                                            className: 'form-config-highlight',
                                            hoverMessage: { value: 'Click CodeLens to edit' }
                                        }
                                    }));
                                    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
                                };

                                let timeout: any;
                                const debounceUpdate = () => {
                                    clearTimeout(timeout);
                                    timeout = setTimeout(updateFeatures, 500);
                                };

                                editor.onDidChangeModelContent(() => {
                                    debounceUpdate();
                                });

                                debounceUpdate();

                                // Register CodeLens Provider
                                if (codeLensProviderRef.current) {
                                    codeLensProviderRef.current.dispose();
                                }
                                codeLensProviderRef.current = monaco.languages.registerCodeLensProvider('typescript', {
                                    provideCodeLenses: async (model: Monaco.editor.ITextModel, _token: Monaco.CancellationToken) => {
                                        if (model.uri.toString() !== editor.getModel()?.uri.toString()) return null;
                                        const code = model.getValue();
                                        const { findAllFormConfigs } = await import('../../utils/astUtils');
                                        const configs = findAllFormConfigs(code);
                                        return {
                                            lenses: configs.map(config => ({
                                                range: {
                                                    startLineNumber: model.getPositionAt(config.start).lineNumber,
                                                    startColumn: 1,
                                                    endLineNumber: model.getPositionAt(config.start).lineNumber,
                                                    endColumn: 1
                                                },
                                                id: config.name,
                                                command: {
                                                    id: commandId,
                                                    title: '⚡️ Edit Config',
                                                    arguments: [config]
                                                }
                                            })),
                                            dispose: () => { }
                                        };
                                    },
                                    resolveCodeLens: (_model: any, codeLens: any) => codeLens
                                });
                            }}
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

            {/* FormConfig Visual Editor Modal */}
            <FormConfigEditor onSave={handleFormConfigSave} />
        </div>
    );
}
