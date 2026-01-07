import { useCallback, useState, useRef } from 'react';
import { Upload, X, Settings, Sparkles, Code2, Play, History } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generatorStore';
import { useCodeGenerator } from '../../hooks/useCodeGenerator';
import { toast } from '../Toast/Toast';
import './TopBar.css';

interface TopBarProps {
    onSettingsClick: () => void;
    onPreviewClick: () => void;
    onHistoryClick: () => void;
}

export function TopBar({ onSettingsClick, onPreviewClick, onHistoryClick }: TopBarProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { currentImage, imagePreview, isGenerating, step } = useGeneratorStore();
    const { handleImageUpload, generateCode, generateEasyFormCode } = useCodeGenerator();
    const { reset } = useGeneratorStore();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                handleImageUpload(file);
            } else {
                toast.warning('请上传图片文件（JPG、PNG、GIF 等）');
            }
        }
    }, [handleImageUpload]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                handleImageUpload(file);
            } else {
                toast.warning('请上传图片文件（JPG、PNG、GIF 等）');
            }
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    }, [handleImageUpload]);

    const handleDropzoneClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleRemoveImage = useCallback(() => {
        reset();
    }, [reset]);

    const handleGenerateClick = useCallback(() => {
        if (step === 'done') {
            generateEasyFormCode();
        } else {
            generateCode();
        }
    }, [step, generateCode, generateEasyFormCode]);

    const getGenerateButtonText = () => {
        switch (step) {
            case 'generating':
                return '生成中...';
            case 'refining':
                return '优化中...';
            case 'done':
                return '重新生成';
            default:
                return '生成代码';
        }
    };

    return (
        <header className="top-bar">
            <div className="top-bar__logo">
                <div className="top-bar__logo-icon">
                    <Code2 size={18} />
                </div>
                <span>VCode</span>
            </div>

            <div className="top-bar__upload-area">
                {!currentImage ? (
                    <div
                        className={`top-bar__dropzone ${isDragActive ? 'top-bar__dropzone--active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleDropzoneClick}
                    >
                        <Upload size={18} className="top-bar__dropzone-icon" />
                        <span className="top-bar__dropzone-text">
                            点击或拖拽上传设计图
                        </span>
                    </div>
                ) : (
                    <div className="top-bar__preview">
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="top-bar__preview-image"
                            />
                        )}
                        <span className="top-bar__preview-name">{currentImage.name}</span>
                        <button
                            className="top-bar__preview-remove"
                            onClick={handleRemoveImage}
                            title="移除图片"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="top-bar__actions">
                <button
                    className="top-bar__generate-btn"
                    onClick={handleGenerateClick}
                    disabled={!currentImage || isGenerating}
                >
                    <Sparkles size={16} />
                    {getGenerateButtonText()}
                </button>
                <button
                    className="top-bar__preview-btn"
                    onClick={onPreviewClick}
                    title="预览代码"
                    disabled={isGenerating}
                >
                    <Play size={16} />
                    预览
                </button>
                <button
                    className="top-bar__settings-btn"
                    onClick={onHistoryClick}
                    title="生成历史"
                >
                    <History size={20} />
                </button>
                <button
                    className="top-bar__settings-btn"
                    onClick={onSettingsClick}
                    title="设置"
                >
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}
