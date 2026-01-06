import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Prompt } from '../../types';
import './PromptManager.css';

interface PromptEditorProps {
    prompt?: Prompt;
    onSave: (name: string, content: string) => void;
    onClose: () => void;
}

function PromptEditor({ prompt, onSave, onClose }: PromptEditorProps) {
    const [name, setName] = useState(prompt?.name || '');
    const [content, setContent] = useState(prompt?.content || '');

    const handleSave = () => {
        if (name.trim() && content.trim()) {
            onSave(name.trim(), content.trim());
        }
    };

    return (
        <div className="prompt-editor-overlay" onClick={onClose}>
            <div className="prompt-editor" onClick={(e) => e.stopPropagation()}>
                <div className="prompt-editor__header">
                    <h3 className="prompt-editor__title">
                        {prompt ? '编辑提示词' : '添加提示词'}
                    </h3>
                    <button className="prompt-editor__close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="prompt-editor__body">
                    <div className="prompt-editor__field">
                        <label className="prompt-editor__label">名称</label>
                        <input
                            type="text"
                            className="prompt-editor__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="输入提示词名称"
                        />
                    </div>
                    <div className="prompt-editor__field">
                        <label className="prompt-editor__label">内容</label>
                        <textarea
                            className="prompt-editor__textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="输入提示词内容..."
                        />
                    </div>
                </div>
                <div className="prompt-editor__footer">
                    <button className="prompt-editor__cancel-btn" onClick={onClose}>
                        取消
                    </button>
                    <button
                        className="prompt-editor__save-btn"
                        onClick={handleSave}
                        disabled={!name.trim() || !content.trim()}
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PromptManager() {
    const { prompts, addPrompt, updatePrompt, deletePrompt } = useSettingsStore();
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = useCallback(() => {
        setIsAdding(true);
    }, []);

    const handleEdit = useCallback((prompt: Prompt) => {
        setEditingPrompt(prompt);
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (confirm('确定要删除这个提示词吗？')) {
            deletePrompt(id);
        }
    }, [deletePrompt]);

    const handleSaveNew = useCallback((name: string, content: string) => {
        addPrompt({ name, content });
        setIsAdding(false);
    }, [addPrompt]);

    const handleSaveEdit = useCallback((name: string, content: string) => {
        if (editingPrompt) {
            updatePrompt(editingPrompt.id, { name, content });
            setEditingPrompt(null);
        }
    }, [editingPrompt, updatePrompt]);

    const handleCloseEditor = useCallback(() => {
        setIsAdding(false);
        setEditingPrompt(null);
    }, []);

    return (
        <div className="prompt-manager">
            <div className="prompt-manager__header">
                <h2 className="prompt-manager__title">提示词管理</h2>
                <button className="prompt-manager__add-btn" onClick={handleAdd}>
                    <Plus size={16} />
                    添加提示词
                </button>
            </div>

            <div className="prompt-manager__list">
                {prompts.length === 0 ? (
                    <div className="prompt-manager__empty">
                        暂无提示词，点击"添加提示词"创建第一个
                    </div>
                ) : (
                    prompts.map((prompt) => (
                        <div key={prompt.id} className="prompt-card">
                            <div className="prompt-card__header">
                                <div className="prompt-card__name">
                                    {prompt.name}
                                    {prompt.isDefault && (
                                        <span className="prompt-card__badge">默认</span>
                                    )}
                                </div>
                                <div className="prompt-card__actions">
                                    <button
                                        className="prompt-card__action-btn"
                                        onClick={() => handleEdit(prompt)}
                                        title="编辑"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    {!prompt.isDefault && (
                                        <button
                                            className="prompt-card__action-btn prompt-card__action-btn--delete"
                                            onClick={() => handleDelete(prompt.id)}
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="prompt-card__content">
                                <p className="prompt-card__text">{prompt.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <PromptEditor onSave={handleSaveNew} onClose={handleCloseEditor} />
            )}

            {editingPrompt && (
                <PromptEditor
                    prompt={editingPrompt}
                    onSave={handleSaveEdit}
                    onClose={handleCloseEditor}
                />
            )}
        </div>
    );
}
