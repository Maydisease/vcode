import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Code2, ArrowLeft } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useGeneratorStore } from '../../stores/generatorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { invoke } from '@tauri-apps/api/core';
import './SandboxPreview.css';

interface SandboxPreviewProps {
    className?: string;
    onBack: () => void;
}

export function SandboxPreview({ className = '', onBack }: SandboxPreviewProps) {
    const iframeContainerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const { files } = useProjectStore();
    const { isGenerating } = useGeneratorStore();
    const { proxyRules } = useSettingsStore();
    const [renderStatus, setRenderStatus] = useState<'idle' | 'rendering' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<{ compileMs: number; renderMs: number } | null>(null);
    const pendingFilesRef = useRef<Record<string, string> | null>(null);

    // Prepare file data for sending
    const prepareFileData = useCallback(() => {
        const fileMap: Record<string, string> = {};
        files.forEach(f => {
            if (f.type === 'file') {
                fileMap[f.name] = f.content ?? '';
            }
        });
        return fileMap;
    }, [files]);

    // Send files to the iframe
    const sendFilesToIframe = useCallback((iframe: HTMLIFrameElement, fileMap: Record<string, string>) => {
        if (!iframe.contentWindow) return;

        const enabledProxyRules = proxyRules.filter(r => r.enabled);
        const activeHostGroup = useSettingsStore.getState().hostGroups.find(h => h.isActive);
        const activeHost = activeHostGroup?.host || '';

        // Resolve proxy rules
        const resolvedRules = enabledProxyRules.map(rule => {
            let target = rule.target;
            if (target.includes('{{HOST}}')) {
                target = target.replace(/\{\{HOST\}\}/g, activeHost);
            }
            return { ...rule, target };
        });

        // Send rules to Rust backend
        invoke('set_proxy_rules', { rules: resolvedRules })
            .catch((err: any) => console.error('Failed to set proxy rules:', err));

        // Send auth token
        const tokenId = activeHostGroup?.tokenId || '';
        invoke('set_auth_token', { token: tokenId })
            .catch((err: any) => console.error('Failed to set auth token:', err));

        console.log('[SandboxPreview] Posting message to iframe');
        iframe.contentWindow.postMessage({
            files: fileMap,
            proxyRules: enabledProxyRules,
            activeHost: activeHost,
            requestId: Date.now().toString()
        }, '*');
    }, [proxyRules]);

    // Create and mount a new iframe
    const createAndMountIframe = useCallback(() => {
        if (!iframeContainerRef.current || files.length === 0) return;

        setRenderStatus('rendering');
        setErrorMessage(null);

        // Remove existing iframe
        if (iframeRef.current) {
            iframeRef.current.remove();
            iframeRef.current = null;
        }

        const fileMap = prepareFileData();
        pendingFilesRef.current = fileMap;

        // Create new iframe
        const iframe = document.createElement('iframe');
        iframe.src = `http://localhost:1422/playground.html?t=${Date.now()}`;
        iframe.className = 'sandbox-preview__iframe';
        iframe.title = 'Preview Sandbox';
        iframe.style.height = '100%';
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');

        // Handle load event
        iframe.onload = () => {
            console.log('[SandboxPreview] Iframe onload fired');
            // Small delay to ensure iframe is fully ready
            setTimeout(() => {
                if (pendingFilesRef.current) {
                    sendFilesToIframe(iframe, pendingFilesRef.current);
                    pendingFilesRef.current = null;
                }
            }, 100);
        };

        iframeRef.current = iframe;
        iframeContainerRef.current.appendChild(iframe);
    }, [files, prepareFileData, sendFilesToIframe]);

    // Debounced render on files change
    useEffect(() => {
        if (files.length === 0 || isGenerating) return;

        const timer = setTimeout(() => {
            createAndMountIframe();
        }, 800);

        return () => clearTimeout(timer);
    }, [files, isGenerating, createAndMountIframe]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (iframeRef.current) {
                console.log('[SandboxPreview] Cleaning up iframe on unmount');
                iframeRef.current.remove();
                iframeRef.current = null;
            }
        };
    }, []);

    // Manual refresh
    const handleRefresh = useCallback(() => {
        createAndMountIframe();
    }, [createAndMountIframe]);

    // Listen for render status messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, metrics: m, error } = event.data || {};

            if (type === 'easyform:render:ok') {
                setRenderStatus('success');
                if (m) setMetrics(m);
            } else if (type === 'easyform:render:error') {
                setRenderStatus('error');
                setErrorMessage(error?.message || '未知渲染错误');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className={`sandbox-preview ${className}`}>
            <div className="sandbox-preview__header">
                <div className="sandbox-preview__title">
                    <Code2 size={16} />
                    <span>实时预览</span>
                    {renderStatus === 'rendering' && <span className="sandbox-preview__status">渲染中...</span>}
                    {renderStatus === 'success' && metrics && (
                        <span className="sandbox-preview__metrics">
                            {metrics.compileMs.toFixed(0)}ms
                        </span>
                    )}
                </div>
                <div className="sandbox-preview__actions">
                    <button
                        className="sandbox-preview__action-btn"
                        onClick={handleRefresh}
                        title="重新渲染"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        className="sandbox-preview__action-btn"
                        onClick={onBack}
                        title="返回编辑"
                    >
                        <ArrowLeft size={14} />
                        <span style={{ marginLeft: 4, fontSize: 12 }}>返回编辑</span>
                    </button>
                </div>
            </div>

            <div className="sandbox-preview__content">
                {errorMessage && (
                    <div className="sandbox-preview__error">
                        <div className="sandbox-preview__error-title">渲染错误</div>
                        <pre className="sandbox-preview__error-msg">{errorMessage}</pre>
                    </div>
                )}
                <div ref={iframeContainerRef} className="sandbox-preview__iframe-container" />
            </div>
        </div>
    );
}
