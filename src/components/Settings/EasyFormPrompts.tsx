import { useState, useCallback, useMemo, useEffect } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import { FileJson, FileCode, Sparkles, RotateCcw, Check, Zap } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { countTokens, formatTokenCount } from '../../services/tokenService';
import './EasyFormPrompts.css';

// Prompt item configuration
interface PromptItem {
    id: string;
    name: string;
    description: string;
    language: 'json' | 'markdown';
    icon: 'json' | 'tsx' | 'ts' | 'refine';
}

const PROMPT_ITEMS: PromptItem[] = [
    {
        id: 'spec',
        name: 'EasyFormSpec',
        description: 'EasyFormService 的 API 规范，用于指导 AI 生成正确的表单代码',
        language: 'json',
        icon: 'json',
    },
    {
        id: 'index',
        name: 'index.tsx',
        description: '生成模块入口文件的提示词模板，包含打开弹窗的按钮和状态管理',
        language: 'markdown',
        icon: 'tsx',
    },
    {
        id: 'modal',
        name: 'modal.tsx',
        description: '生成弹窗表单组件的提示词模板，使用 EasyFormService 创建表单',
        language: 'markdown',
        icon: 'tsx',
    },
    {
        id: 'service',
        name: 'scope.service.ts',
        description: '生成服务接口文件的提示词模板，继承 ScopeBaseService',
        language: 'markdown',
        icon: 'ts',
    },
    {
        id: 'refine',
        name: '回炉整合',
        description: '三个文件生成后进行整合优化，确保 import 路径和类型定义一致',
        language: 'markdown',
        icon: 'refine',
    },
];

// Disable validation for editor
const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: false,
    });
};

export function EasyFormPrompts() {
    const {
        easyFormSpec,
        easyFormIndexPrompt,
        easyFormModalPrompt,
        easyFormServicePrompt,
        easyFormRefinePrompt,
        updateEasyFormSpec,
        updateEasyFormIndexPrompt,
        updateEasyFormModalPrompt,
        updateEasyFormServicePrompt,
        updateEasyFormRefinePrompt,
    } = useSettingsStore();

    const [activeId, setActiveId] = useState<string>('spec');
    const [saved, setSaved] = useState(false);
    const [tokenCounts, setTokenCounts] = useState<Record<string, number>>({});

    // Calculate token counts for all prompts
    useEffect(() => {
        const calculateTokens = async () => {
            const contents: Record<string, string> = {
                spec: easyFormSpec,
                index: easyFormIndexPrompt,
                modal: easyFormModalPrompt,
                service: easyFormServicePrompt,
                refine: easyFormRefinePrompt,
            };

            const counts: Record<string, number> = {};
            for (const [id, content] of Object.entries(contents)) {
                if (content) {
                    const result = await countTokens(content);
                    counts[id] = result.count;
                }
            }
            setTokenCounts(counts);
        };

        calculateTokens();
    }, [easyFormSpec, easyFormIndexPrompt, easyFormModalPrompt, easyFormServicePrompt, easyFormRefinePrompt]);

    // Get current prompt content and updater
    const { content, updateContent, activeItem } = useMemo(() => {
        const item = PROMPT_ITEMS.find(p => p.id === activeId) || PROMPT_ITEMS[0];

        const contentMap: Record<string, string> = {
            spec: easyFormSpec,
            index: easyFormIndexPrompt,
            modal: easyFormModalPrompt,
            service: easyFormServicePrompt,
            refine: easyFormRefinePrompt,
        };

        const updaterMap: Record<string, (value: string) => void> = {
            spec: updateEasyFormSpec,
            index: updateEasyFormIndexPrompt,
            modal: updateEasyFormModalPrompt,
            service: updateEasyFormServicePrompt,
            refine: updateEasyFormRefinePrompt,
        };

        return {
            content: contentMap[activeId] || '',
            updateContent: updaterMap[activeId],
            activeItem: item,
        };
    }, [
        activeId,
        easyFormSpec,
        easyFormIndexPrompt,
        easyFormModalPrompt,
        easyFormServicePrompt,
        easyFormRefinePrompt,
        updateEasyFormSpec,
        updateEasyFormIndexPrompt,
        updateEasyFormModalPrompt,
        updateEasyFormServicePrompt,
        updateEasyFormRefinePrompt,
    ]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value !== undefined && updateContent) {
            updateContent(value);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    }, [updateContent]);

    const handleReset = useCallback(() => {
        if (confirm(`确定要重置 "${activeItem.name}" 为默认值吗？`)) {
            // Clear this specific prompt from localStorage
            const stored = localStorage.getItem('vcode-settings');
            if (stored) {
                const data = JSON.parse(stored);
                const keyMap: Record<string, string> = {
                    spec: 'easyFormSpec',
                    index: 'easyFormIndexPrompt',
                    modal: 'easyFormModalPrompt',
                    service: 'easyFormServicePrompt',
                    refine: 'easyFormRefinePrompt',
                };
                delete data.state[keyMap[activeId]];
                localStorage.setItem('vcode-settings', JSON.stringify(data));
                window.location.reload();
            }
        }
    }, [activeId, activeItem.name]);

    const getIcon = (iconType: string) => {
        switch (iconType) {
            case 'json':
                return <FileJson size={14} className="easyform-prompts__sidebar-item-icon easyform-prompts__sidebar-item-icon--json" />;
            case 'tsx':
                return <FileCode size={14} className="easyform-prompts__sidebar-item-icon easyform-prompts__sidebar-item-icon--tsx" />;
            case 'ts':
                return <FileCode size={14} className="easyform-prompts__sidebar-item-icon easyform-prompts__sidebar-item-icon--ts" />;
            case 'refine':
                return <Sparkles size={14} className="easyform-prompts__sidebar-item-icon easyform-prompts__sidebar-item-icon--refine" />;
            default:
                return <FileCode size={14} className="easyform-prompts__sidebar-item-icon" />;
        }
    };

    return (
        <div className="easyform-prompts">
            {/* Sidebar */}
            <aside className="easyform-prompts__sidebar">
                <div className="easyform-prompts__sidebar-header">提示词列表</div>
                <div className="easyform-prompts__sidebar-list">
                    {PROMPT_ITEMS.map((item) => (
                        <div
                            key={item.id}
                            className={`easyform-prompts__sidebar-item ${activeId === item.id ? 'easyform-prompts__sidebar-item--active' : ''}`}
                            onClick={() => setActiveId(item.id)}
                        >
                            {getIcon(item.icon)}
                            <span className="easyform-prompts__sidebar-item-text">{item.name}</span>
                            {tokenCounts[item.id] !== undefined && (
                                <span className="easyform-prompts__sidebar-item-tokens">
                                    <Zap size={10} />
                                    {formatTokenCount(tokenCounts[item.id])}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Editor Panel */}
            <div className="easyform-prompts__editor">
                <div className="easyform-prompts__editor-header">
                    <div className="easyform-prompts__editor-title">
                        {activeItem.name}
                        <span className={`easyform-prompts__editor-tag ${activeItem.language === 'json' ? 'easyform-prompts__editor-tag--json' : ''}`}>
                            {activeItem.language.toUpperCase()}
                        </span>
                    </div>
                    <div className="easyform-prompts__editor-actions">
                        {saved && (
                            <span className="easyform-prompts__action-btn easyform-prompts__action-btn--success">
                                <Check size={14} />
                                已保存
                            </span>
                        )}
                        <button className="easyform-prompts__action-btn" onClick={handleReset}>
                            <RotateCcw size={14} />
                            重置
                        </button>
                    </div>
                </div>
                <div className="easyform-prompts__editor-desc">
                    {activeItem.description}
                </div>
                <div className="easyform-prompts__editor-content">
                    <Editor
                        key={activeId}
                        height="100%"
                        language={activeItem.language}
                        value={content}
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
                </div>
            </div>
        </div>
    );
}
