import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { BestExample } from '../../types';
import './BestExamples.css';

export function BestExamples() {
    const { bestExamples, bestExamplesEnabled, addBestExample, updateBestExample, deleteBestExample, setBestExamplesEnabled } = useSettingsStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [indexCode, setIndexCode] = useState('');
    const [modalCode, setModalCode] = useState('');
    const [serviceCode, setServiceCode] = useState('');

    const resetForm = () => {
        setName('');
        setDescription('');
        setIndexCode('');
        setModalCode('');
        setServiceCode('');
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        // Pre-fill name from the last example if exists
        const lastExample = bestExamples[bestExamples.length - 1];
        setName(lastExample?.name || '');
        setDescription('');
        setIndexCode('');
        setModalCode('');
        setServiceCode('');
    };

    const handleEdit = (example: BestExample) => {
        setEditingId(example.id);
        setIsAdding(false);
        setExpandedId(example.id);
        setName(example.name);
        setDescription(example.description || '');
        setIndexCode(example.indexCode);
        setModalCode(example.modalCode);
        setServiceCode(example.serviceCode);
    };

    const handleSave = () => {
        if (!name.trim()) return;

        if (isAdding) {
            addBestExample({
                name: name.trim(),
                description: description.trim() || undefined,
                indexCode,
                modalCode,
                serviceCode,
            });
        } else if (editingId) {
            updateBestExample(editingId, {
                name: name.trim(),
                description: description.trim() || undefined,
                indexCode,
                modalCode,
                serviceCode,
            });
        }

        setIsAdding(false);
        setEditingId(null);
        resetForm();
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        resetForm();
    };

    const handleDelete = (id: string) => {
        // Direct delete without confirm (confirm doesn't work well in Tauri)
        deleteBestExample(id);
        if (editingId === id) {
            handleCancel();
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const isEditing = isAdding || editingId !== null;

    return (
        <div className="best-examples">
            <div className="best-examples__header">
                <h2>最佳例子</h2>
                <p className="best-examples__description">
                    管理最佳页面组合例子，这些例子将在代码重新生成时作为参考。
                </p>
                <div className="best-examples__toggle">
                    <label className="best-examples__toggle-label">
                        <input
                            type="checkbox"
                            checked={bestExamplesEnabled}
                            onChange={(e) => setBestExamplesEnabled(e.target.checked)}
                        />
                        <span className="best-examples__toggle-slider"></span>
                        <span className="best-examples__toggle-text">
                            {bestExamplesEnabled ? '已启用最佳例子指导' : '已禁用最佳例子指导'}
                        </span>
                    </label>
                </div>
            </div>

            {!isEditing && (
                <button className="best-examples__add-btn" onClick={handleAdd}>
                    <Plus size={16} />
                    添加例子
                </button>
            )}

            {isEditing && (
                <div className="best-examples__editor">
                    <div className="best-examples__form-group">
                        <label>例子名称 *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="如：用户管理弹窗"
                        />
                    </div>
                    <div className="best-examples__form-group">
                        <label>描述</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="简短描述这个例子的特点"
                        />
                    </div>

                    <div className="best-examples__code-section">
                        <label>index.tsx</label>
                        <textarea
                            value={indexCode}
                            onChange={(e) => setIndexCode(e.target.value)}
                            placeholder="入口文件代码"
                            rows={8}
                        />
                    </div>

                    <div className="best-examples__code-section">
                        <label>modal.tsx</label>
                        <textarea
                            value={modalCode}
                            onChange={(e) => setModalCode(e.target.value)}
                            placeholder="弹窗表单代码"
                            rows={8}
                        />
                    </div>

                    <div className="best-examples__code-section">
                        <label>scope.service.ts</label>
                        <textarea
                            value={serviceCode}
                            onChange={(e) => setServiceCode(e.target.value)}
                            placeholder="服务接口代码"
                            rows={8}
                        />
                    </div>

                    <div className="best-examples__actions">
                        <button className="best-examples__save-btn" onClick={handleSave}>
                            <Save size={14} />
                            保存
                        </button>
                        <button className="best-examples__cancel-btn" onClick={handleCancel}>
                            <X size={14} />
                            取消
                        </button>
                    </div>
                </div>
            )}

            <div className="best-examples__list">
                {bestExamples.length === 0 && !isEditing && (
                    <div className="best-examples__empty">
                        暂无例子，点击上方按钮添加
                    </div>
                )}

                {bestExamples.map((example) => (
                    <div key={example.id} className="best-examples__item">
                        <div
                            className="best-examples__item-header"
                            onClick={() => toggleExpand(example.id)}
                        >
                            <span className="best-examples__item-toggle">
                                {expandedId === example.id ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </span>
                            <span className="best-examples__item-name">{example.name}</span>
                            {example.description && (
                                <span className="best-examples__item-desc">
                                    {example.description}
                                </span>
                            )}
                            <div className="best-examples__item-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(example);
                                    }}
                                    title="编辑"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(example.id);
                                    }}
                                    title="删除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {expandedId === example.id && editingId !== example.id && (
                            <div className="best-examples__item-preview">
                                <div className="best-examples__preview-section">
                                    <h4>index.tsx</h4>
                                    <pre>{example.indexCode || '(空)'}</pre>
                                </div>
                                <div className="best-examples__preview-section">
                                    <h4>modal.tsx</h4>
                                    <pre>{example.modalCode || '(空)'}</pre>
                                </div>
                                <div className="best-examples__preview-section">
                                    <h4>scope.service.ts</h4>
                                    <pre>{example.serviceCode || '(空)'}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
