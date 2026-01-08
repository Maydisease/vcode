/**
 * Visual FormConfig Editor Modal
 * Allows users to edit form field configurations through a UI
 */
import { useState, useCallback } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Code, Eye } from 'lucide-react';
import { useFormConfigEditorStore } from '../../stores/formConfigEditorStore';
import { generateFormConfigCode, createEmptyField, FIELD_TYPES, type FormField } from '../../utils/codeGenerator';
import './FormConfigEditor.css';

interface FormConfigEditorProps {
    onSave: (code: string) => void;
}

export function FormConfigEditor({ onSave }: FormConfigEditorProps) {
    const {
        isOpen,
        fields,
        variableName,
        typeName,
        close,
        updateField,
        addField,
        removeField,
        reorderFields,
    } = useFormConfigEditorStore();

    const [expandedField, setExpandedField] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleAddField = useCallback(() => {
        const newField = createEmptyField();
        addField(newField);
        setExpandedField(newField.id);
    }, [addField]);

    const handleSave = useCallback(() => {
        const code = generateFormConfigCode(fields, '    ');
        onSave(code);
        close();
    }, [fields, onSave, close]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedField(prev => prev === id ? null : id);
    }, []);

    const previewCode = generateFormConfigCode(fields, '  ');

    if (!isOpen) return null;

    return (
        <div className="form-config-editor__overlay">
            <div className="form-config-editor__modal">
                {/* Header */}
                <div className="form-config-editor__header">
                    <div className="form-config-editor__title">
                        <Code size={20} />
                        <span>编辑 {variableName}</span>
                        <span className="form-config-editor__type-badge">{typeName}</span>
                    </div>
                    <div className="form-config-editor__header-actions">
                        <button
                            className={`form-config-editor__preview-toggle ${showPreview ? 'active' : ''}`}
                            onClick={() => setShowPreview(!showPreview)}
                            title="预览代码"
                        >
                            <Eye size={16} />
                            预览
                        </button>
                        <button className="form-config-editor__close" onClick={close}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="form-config-editor__content">
                    {/* Fields List */}
                    <div className={`form-config-editor__fields ${showPreview ? 'with-preview' : ''}`}>
                        {fields.length === 0 ? (
                            <div className="form-config-editor__empty">
                                <p>暂无字段配置</p>
                                <button onClick={handleAddField}>
                                    <Plus size={16} /> 添加字段
                                </button>
                            </div>
                        ) : (
                            <div className="form-config-editor__field-list">
                                {fields.map((field, index) => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        index={index}
                                        isExpanded={expandedField === field.id}
                                        isDragging={false}
                                        onToggleExpand={() => toggleExpand(field.id)}
                                        onUpdate={(updates) => updateField(field.id, updates)}
                                        onRemove={() => removeField(field.id)}
                                        onMoveUp={() => reorderFields(index, index - 1)}
                                        onMoveDown={() => reorderFields(index, index + 1)}
                                        canMoveUp={index > 0}
                                        canMoveDown={index < fields.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        <button className="form-config-editor__add-btn" onClick={handleAddField}>
                            <Plus size={16} /> 添加字段
                        </button>
                    </div>

                    {/* Code Preview */}
                    {showPreview && (
                        <div className="form-config-editor__preview">
                            <div className="form-config-editor__preview-header">
                                <Code size={14} />
                                <span>代码预览</span>
                            </div>
                            <pre className="form-config-editor__preview-code">
                                {previewCode}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="form-config-editor__footer">
                    <div className="form-config-editor__stats">
                        共 {fields.length} 个字段
                    </div>
                    <div className="form-config-editor__actions">
                        <button className="form-config-editor__btn form-config-editor__btn--cancel" onClick={close}>
                            取消
                        </button>
                        <button className="form-config-editor__btn form-config-editor__btn--save" onClick={handleSave}>
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Single field item component
 */
interface FieldItemProps {
    field: FormField;
    index: number;
    isExpanded: boolean;
    isDragging: boolean;
    onToggleExpand: () => void;
    onUpdate: (updates: Partial<FormField>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

function FieldItem({
    field,
    index,
    isExpanded,
    isDragging,
    onToggleExpand,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: FieldItemProps) {
    return (
        <div
            className={`form-config-editor__field ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
        >
            {/* Field Header */}
            <div className="form-config-editor__field-header">
                <div className="form-config-editor__field-move">
                    <button
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                        title="上移"
                        className="move-btn"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                        title="下移"
                        className="move-btn"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
                <div className="form-config-editor__field-index">{index + 1}</div>
                <div className="form-config-editor__field-summary" onClick={onToggleExpand}>
                    <span className="form-config-editor__field-label">
                        {field.label || '(未命名)'}
                    </span>
                    <span className="form-config-editor__field-type-tag">
                        {field.type}
                    </span>
                    <span className="form-config-editor__field-name">
                        {field.name}
                    </span>
                </div>
                <div className="form-config-editor__field-actions">
                    <button onClick={onToggleExpand} title={isExpanded ? '收起' : '展开'}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={onRemove} className="danger" title="删除">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Field Details (expanded) */}
            {isExpanded && (
                <div className="form-config-editor__field-details">
                    <div className="form-config-editor__field-row">
                        <label>类型</label>
                        <select
                            value={field.type}
                            onChange={(e) => {
                                const newType = e.target.value;
                                // Types that require data option
                                const typesNeedData = ['select', 'radio', 'checkbox', 'cascader', 'treeSelect'];
                                const needsData = typesNeedData.includes(newType);

                                if (needsData) {
                                    // Switching to a type that needs data - auto-add if missing
                                    onUpdate({
                                        type: newType,
                                        data: field.data || '[]',
                                    });
                                } else {
                                    // Switching to a type that doesn't need data - remove it
                                    onUpdate({
                                        type: newType,
                                        data: undefined,
                                    });
                                }
                            }}
                        >
                            {FIELD_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-config-editor__field-row">
                        <label>字段名 (name)</label>
                        <input
                            type="text"
                            value={field.name}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                            placeholder="例如: username"
                        />
                    </div>
                    <div className="form-config-editor__field-row">
                        <label>标签 (label)</label>
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => onUpdate({ label: e.target.value })}
                            placeholder="例如: 用户名"
                        />
                    </div>
                    <div className="form-config-editor__field-row">
                        <label>占位符 (placeholder)</label>
                        <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
                            placeholder="可选"
                        />
                    </div>
                    {/* Show data field for types that need options */}
                    {['select', 'radio', 'checkbox', 'cascader', 'treeSelect'].includes(field.type) && (
                        <div className="form-config-editor__field-row full-width">
                            <label>数据源 (data) <span className="form-config-editor__field-hint">数组或异步函数</span></label>
                            <textarea
                                value={field.data || ''}
                                onChange={(e) => onUpdate({ data: e.target.value || undefined })}
                                rows={3}
                                className="code-input"
                                placeholder='例如: [{ label: "选项1", value: "1" }] 或 async () => await api.getData()'
                            />
                        </div>
                    )}
                    <div className="form-config-editor__field-row checkbox-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={(e) => onUpdate({ required: e.target.checked || undefined })}
                            />
                            必填
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
