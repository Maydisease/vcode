import { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { FileText, Info, CheckCircle, AlertTriangle, XCircle, X, Timer, Zap, FileCode, Terminal } from 'lucide-react';
import { useLogStore } from '../../stores/logStore';
import { useGeneratorStore } from '../../stores/generatorStore';
import { formatTokenCount } from '../../services/tokenService';
import type { LogLevel, LogEntry } from '../../types';
import './WorkLog.css';

const levelIcons: Record<LogLevel, React.ReactNode> = {
    info: <Info size={14} className="log-entry__icon log-entry__icon--info" />,
    success: <CheckCircle size={14} className="log-entry__icon log-entry__icon--success" />,
    warning: <AlertTriangle size={14} className="log-entry__icon log-entry__icon--warning" />,
    error: <XCircle size={14} className="log-entry__icon log-entry__icon--error" />,
};

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

interface ImagePreviewProps {
    imageUrl: string;
    onClose: () => void;
}

function ImagePreview({ imageUrl, onClose }: ImagePreviewProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="image-preview-overlay" onClick={onClose}>
            <button className="image-preview-overlay__close" onClick={onClose}>
                <X size={24} />
            </button>
            <img
                src={imageUrl}
                alt="Preview"
                className="image-preview-overlay__image"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

interface PromptViewerProps {
    content: string;
    title: string;
    onClose: () => void;
}

function PromptViewer({ content, title, onClose }: PromptViewerProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="prompt-viewer-overlay" onClick={onClose}>
            <div className="prompt-viewer-container" onClick={e => e.stopPropagation()}>
                <div className="prompt-viewer-header">
                    <div className="prompt-viewer-title">
                        <Terminal size={18} />
                        <span>完整提示词 <span className="prompt-viewer-subtitle">{title}</span></span>
                    </div>
                    <button className="prompt-viewer-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="prompt-viewer-content">
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={content}
                        theme="light"
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            fontSize: 13,
                            padding: { top: 16, bottom: 16 },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// Component for running task with live elapsed time
function RunningTimer({ startTime }: { startTime: number }) {
    const [elapsed, setElapsed] = useState(Date.now() - startTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 100);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <span className="log-entry__duration log-entry__duration--running">
            <Timer size={12} className="animate-pulse" />
            {formatDuration(elapsed)}
        </span>
    );
}

// Component for displaying log entry with duration
function LogEntryItem({ log, onImageClick, onPromptClick }: { log: LogEntry; onImageClick: (url: string) => void; onPromptClick: (content: string, title: string) => void }) {
    const hasTokens = (log.inputTokens !== undefined && log.inputTokens > 0) ||
        (log.outputTokens !== undefined && log.outputTokens > 0);
    const hasMeta = hasTokens || log.isRunning || (log.duration !== undefined && !log.isRunning) || log.promptContent;

    return (
        <div className={`log-entry log-entry--${log.level}`}>
            {/* Row 1: Main content - time, icon, full message */}
            <div className="log-entry__main">
                <span className="log-entry__time">{formatTime(log.timestamp)}</span>
                {levelIcons[log.level]}
                <span className="log-entry__message">{log.message}</span>
            </div>

            {/* Row 2: Metadata - tokens, duration, prompt button */}
            {hasMeta && (
                <div className="log-entry__meta">
                    {hasTokens && (
                        <span className="log-entry__tokens">
                            <Zap size={10} />
                            {log.inputTokens !== undefined && log.inputTokens > 0 && (
                                <span className="log-entry__tokens-in">
                                    ↑{formatTokenCount(log.inputTokens)}
                                </span>
                            )}
                            {log.outputTokens !== undefined && log.outputTokens > 0 && (
                                <span className="log-entry__tokens-out">
                                    ↓{formatTokenCount(log.outputTokens)}
                                </span>
                            )}
                        </span>
                    )}
                    {log.isRunning && <RunningTimer startTime={log.timestamp} />}
                    {log.duration !== undefined && !log.isRunning && (
                        <span className="log-entry__duration">
                            {formatDuration(log.duration)}
                        </span>
                    )}
                    {log.promptContent && (
                        <button
                            className="log-entry__prompt-btn"
                            onClick={() => onPromptClick(log.promptContent!, log.message)}
                            title="查看完整提示词"
                        >
                            <FileCode size={11} />
                            查看提示词
                        </button>
                    )}
                </div>
            )}
            {log.imageUrl && (
                <div className="log-entry__image-container">
                    <img
                        src={log.imageUrl}
                        alt="Uploaded"
                        className="log-entry__thumbnail"
                        onClick={() => onImageClick(log.imageUrl!)}
                        title="点击查看原图"
                    />
                </div>
            )}
        </div>
    );
}

// Total duration and token display
function TotalSummary() {
    const { taskStartTime, getTotalTokens } = useLogStore();
    const { isGenerating } = useGeneratorStore();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!taskStartTime) {
            setElapsed(0);
            return;
        }

        if (isGenerating) {
            const interval = setInterval(() => {
                setElapsed(Date.now() - taskStartTime);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setElapsed(Date.now() - taskStartTime);
        }
    }, [taskStartTime, isGenerating]);

    const totalTokens = getTotalTokens();
    const hasTokens = totalTokens.input > 0 || totalTokens.output > 0;

    if (!taskStartTime || elapsed === 0) return null;

    return (
        <div className={`work-log__summary ${isGenerating ? 'work-log__summary--running' : ''}`}>
            <div className="work-log__summary-item">
                <Timer size={14} />
                <span>耗时: {formatDuration(elapsed)}</span>
            </div>
            {hasTokens && (
                <div className="work-log__summary-item work-log__summary-tokens">
                    <Zap size={14} />
                    <span>
                        ↑{formatTokenCount(totalTokens.input)} / ↓{formatTokenCount(totalTokens.output)}
                    </span>
                </div>
            )}
        </div>
    );
}

export function WorkLog() {
    const { logs } = useLogStore();
    const contentRef = useRef<HTMLDivElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewingPrompt, setViewingPrompt] = useState<{ content: string; title: string } | null>(null);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [logs]);

    const handleImageClick = useCallback((imageUrl: string) => {
        setPreviewImage(imageUrl);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewImage(null);
    }, []);

    const handlePromptClick = useCallback((content: string, title: string) => {
        setViewingPrompt({ content, title });
    }, []);

    const handleClosePrompt = useCallback(() => {
        setViewingPrompt(null);
    }, []);

    return (
        <div className="work-log">
            {/* Header removed and merged into SidePanel tabs */}
            <div className="work-log__content" ref={contentRef}>
                {logs.length === 0 ? (
                    <div className="work-log__empty">
                        <FileText size={32} />
                        <span>暂无日志</span>
                    </div>
                ) : (
                    <div className="work-log__entries">
                        {logs.map((log) => (
                            <LogEntryItem
                                key={log.id}
                                log={log}
                                onImageClick={handleImageClick}
                                onPromptClick={handlePromptClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            <TotalSummary />

            {previewImage && (
                <ImagePreview imageUrl={previewImage} onClose={handleClosePreview} />
            )}
            {viewingPrompt && (
                <PromptViewer content={viewingPrompt.content} title={viewingPrompt.title} onClose={handleClosePrompt} />
            )}
        </div>
    );
}
