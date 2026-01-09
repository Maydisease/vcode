import React, { useState, useCallback, useEffect } from 'react';
import { X, Check, Loader2, ImageIcon, Sparkles, Link2 } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generatorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ApiSelectorContent } from './StepApiSelect';
import { useCodeGenerator } from '../../hooks/useCodeGenerator';
import type { SelectedApis } from '../ApiSelector/ApiSelector';
import './UploadWizard.css';

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    // Split into lines for processing
    const lines = markdown.split('\n');
    const processedLines: string[] = [];
    let inTable = false;
    const tableRows: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if this is a table row
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            const content = trimmedLine.slice(1, -1); // Remove outer pipes
            const cells = content.split('|').map(c => c.trim());

            // Skip header divider rows (|---|---|---|)
            if (cells.every(c => /^-+$/.test(c))) {
                continue;
            }

            if (!inTable) {
                inTable = true;
            }
            tableRows.push(`<tr>${cells.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
        } else {
            // Flush table if we were in one
            if (inTable) {
                processedLines.push(`<table class="md-table">${tableRows.join('')}</table>`);
                tableRows.length = 0;
                inTable = false;
            }

            // Skip empty lines
            if (!trimmedLine) continue;

            // Process regular text line
            let processedLine = escapeHtml(trimmedLine);
            // Bold
            processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            processedLines.push(`<p>${processedLine}</p>`);
        }
    }

    // Flush remaining table
    if (inTable && tableRows.length > 0) {
        processedLines.push(`<table class="md-table">${tableRows.join('')}</table>`);
    }

    return processedLines.join('');
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

type WizardStep = 1 | 2 | 3;

const STEP_TITLES = {
    1: '上传图片',
    2: '识别图片',
    3: '选择接口',
};

export function UploadWizard() {
    const {
        wizardOpen,
        imagePreview,
        currentImage,
        customPrompt,
        imageSummary,
        setWizardOpen,
        setCustomPrompt,
        setImageSummary,
        setImageFullDescription,
        setStep,
        reset,
    } = useGeneratorStore();

    const { apiKey, modelConfig } = useSettingsStore();
    const { handleApiSelection, generateEasyFormCode } = useCodeGenerator();

    const [currentStep, setCurrentStep] = useState<WizardStep>(1);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizeError, setRecognizeError] = useState<string | null>(null);

    useEffect(() => {
        if (wizardOpen) {
            setCurrentStep(1);
            setImageSummary('');
            setImageFullDescription('');
            setRecognizeError(null);
        }
    }, [wizardOpen, setImageSummary, setImageFullDescription]);

    const handleClose = useCallback(() => {
        setWizardOpen(false);
        reset();
    }, [setWizardOpen, reset]);

    const handleRecognize = useCallback(async () => {
        if (!currentImage || !apiKey) {
            setRecognizeError('请先在设置中配置 API Key');
            return;
        }

        setIsRecognizing(true);
        setRecognizeError(null);

        try {
            // Read image as base64
            const imageBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(currentImage);
            });

            // Call backend API for image recognition
            const { invoke } = await import('@tauri-apps/api/core');
            const result = await invoke<{ summary: string; full: string; is_form: boolean }>('parse_image_description', {
                provider: modelConfig.provider || 'google',
                apiKey: apiKey,
                baseUrl: modelConfig.openaiBaseUrl || null,
                model: modelConfig.model || null,
                imageBase64: imageBase64,
                imageMimeType: currentImage.type,
                customPrompt: customPrompt || null,
            });

            setImageSummary(result.summary);
            setImageFullDescription(result.full);

            // Check if it's a valid form
            if (!result.is_form) {
                setRecognizeError('未检测到有效的表单界面。识别结果如上所示，请上传包含表单的设计图。');
            } else {
                setCurrentStep(2);
            }
        } catch (error) {
            const message = typeof error === 'string'
                ? error
                : (error instanceof Error ? error.message : '识别图片失败');
            setRecognizeError(message);
        } finally {
            setIsRecognizing(false);
        }
    }, [currentImage, apiKey, modelConfig, customPrompt, setImageSummary, setImageFullDescription]);

    const handleApiConfirm = useCallback((apis: SelectedApis) => {
        handleApiSelection(apis);
        setWizardOpen(false);
        setStep('generating');
        generateEasyFormCode();
    }, [handleApiSelection, setWizardOpen, setStep, generateEasyFormCode]);

    const handleSkipApi = useCallback(() => {
        setWizardOpen(false);
        setStep('idle');
    }, [setWizardOpen, setStep]);

    if (!wizardOpen) return null;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                // Show loading overlay when recognizing
                if (isRecognizing) {
                    return (
                        <div className="step-upload step-upload--loading">
                            <div className="step-upload__loading-overlay">
                                <Loader2 size={40} className="step-upload__loading-icon" />
                                <span className="step-upload__loading-text">正在识别图片内容...</span>
                                <span className="step-upload__loading-hint">这可能需要几秒钟</span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="step-upload">
                        {imagePreview && (
                            <div className="step-upload__preview">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="step-upload__preview-img"
                                />
                            </div>
                        )}
                        <div>
                            <label className="step-upload__prompt-label">
                                附加提示词（可选）
                            </label>
                            <textarea
                                className="step-upload__prompt-input"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="例如：这是一个用户管理页面的设计图，请注意表单中的字段验证规则..."
                            />
                        </div>
                        {/* Show recognition result if available (even on error for non-form case) */}
                        {imageSummary && (
                            <div className="step-upload__result">
                                <div className="step-upload__result-label">识别结果</div>
                                <div
                                    className="step-upload__result-content"
                                    dangerouslySetInnerHTML={{ __html: markdownToHtml(imageSummary) }}
                                />
                            </div>
                        )}
                        {recognizeError && (
                            <div className="step-upload__error">
                                <span className="step-upload__error-icon">⚠️</span>
                                <span className="step-upload__error-text">{recognizeError}</span>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="step-recognize">
                        {isRecognizing ? (
                            <div className="step-recognize__loading">
                                <Loader2 size={32} className="step-recognize__loading-icon" />
                                <span>正在识别图片内容...</span>
                            </div>
                        ) : recognizeError ? (
                            <div className="step-recognize__result">
                                <div className="step-recognize__result-label" style={{ color: 'var(--color-error)' }}>
                                    识别失败
                                </div>
                                <div className="step-recognize__result-content" style={{ borderColor: 'var(--color-error)' }}>
                                    {recognizeError}
                                </div>
                            </div>
                        ) : (
                            <div className="step-recognize__result">
                                <div className="step-recognize__result-label">
                                    图片识别结果
                                </div>
                                <div
                                    className="step-recognize__result-content step-recognize__result-markdown"
                                    dangerouslySetInnerHTML={{ __html: markdownToHtml(imageSummary) || '暂无识别结果' }}
                                />
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="step-api-select">
                        <ApiSelectorContent
                            onConfirm={handleApiConfirm}
                            onSkip={handleSkipApi}
                            hideActions
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const renderFooter = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--secondary"
                            onClick={handleClose}
                        >
                            取消
                        </button>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--primary"
                            onClick={handleRecognize}
                            disabled={!imagePreview || isRecognizing}
                        >
                            <Sparkles size={14} />
                            识别图片
                        </button>
                    </>
                );

            case 2:
                return (
                    <>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--secondary"
                            onClick={() => setCurrentStep(1)}
                        >
                            上一步
                        </button>
                        {recognizeError ? (
                            <button
                                className="upload-wizard__btn upload-wizard__btn--primary"
                                onClick={handleRecognize}
                                disabled={isRecognizing}
                            >
                                <Sparkles size={14} />
                                重试
                            </button>
                        ) : (
                            <button
                                className="upload-wizard__btn upload-wizard__btn--primary"
                                onClick={() => setCurrentStep(3)}
                                disabled={!imageSummary}
                            >
                                下一步
                            </button>
                        )}
                    </>
                );

            case 3:
                return (
                    <>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--secondary"
                            onClick={() => setCurrentStep(2)}
                        >
                            上一步
                        </button>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--secondary"
                            onClick={handleSkipApi}
                        >
                            跳过
                        </button>
                        <button
                            className="upload-wizard__btn upload-wizard__btn--primary"
                            onClick={() => {
                                // Trigger the hidden confirm button in ApiSelectorContent
                                const btn = document.getElementById('wizard-api-confirm-btn');
                                if (btn) btn.click();
                            }}
                        >
                            <Sparkles size={14} />
                            生成代码
                        </button>
                    </>
                );

            default:
                return null;
        }
    };

    const getStepIcon = (step: number) => {
        switch (step) {
            case 1: return <ImageIcon size={12} />;
            case 2: return <Sparkles size={12} />;
            case 3: return <Link2 size={12} />;
            default: return step;
        }
    };

    return (
        <div className="upload-wizard-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
        }}>
            <div className="upload-wizard">
                <div className="upload-wizard__header">
                    <span className="upload-wizard__title">
                        {STEP_TITLES[currentStep]}
                    </span>
                    <button className="upload-wizard__close" onClick={handleClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="upload-wizard__stepper">
                    {[1, 2, 3].map((step, index) => (
                        <React.Fragment key={step}>
                            <div className="upload-wizard__step">
                                <div className={`upload-wizard__step-number ${currentStep === step ? 'upload-wizard__step-number--active' : ''
                                    } ${currentStep > step ? 'upload-wizard__step-number--completed' : ''
                                    }`}>
                                    {currentStep > step ? <Check size={12} /> : getStepIcon(step)}
                                </div>
                                <span className={`upload-wizard__step-label ${currentStep === step ? 'upload-wizard__step-label--active' : ''
                                    }`}>
                                    {STEP_TITLES[step as WizardStep]}
                                </span>
                            </div>
                            {index < 2 && (
                                <div className={`upload-wizard__step-divider ${currentStep > step ? 'upload-wizard__step-divider--completed' : ''
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="upload-wizard__content">
                    {renderStepContent()}
                </div>

                <div className="upload-wizard__footer">
                    {renderFooter()}
                </div>
            </div>
        </div>
    );
}
