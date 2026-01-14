import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { X, Sparkles, ArrowRight, Download, RefreshCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from '../Toast/Toast';
import './UpdateModal.css';

export function UpdateModal() {
    const { updateModal, closeUpdateModal } = useUIStore();
    const { isOpen, versionInfo, updateHandle, status } = updateModal;
    const [isUpdating, setIsUpdating] = useState(false);
    const [progress, setProgress] = useState(0);

    if (!isOpen || !versionInfo) return null;

    const handleUpdate = async () => {
        if (!updateHandle) return;
        setIsUpdating(true);
        try {
            await updateHandle.downloadAndInstall((event) => {
                if (event.event === 'Progress') {
                    const data = event.data as any;
                    if (data.contentLength) {
                        setProgress(Math.round((data.chunkLength / data.contentLength) * 100));
                    }
                }
            });

            setTimeout(async () => {
                await relaunch();
            }, 1000);

        } catch (error) {
            console.error('Update failed:', error);
            setIsUpdating(false);
            toast.error('更新失败，请重试');
        }
    };

    const renderContent = () => {
        if (status === 'checking') {
            return (
                <div className="update-modal__status-state">
                    <Loader2 size={32} className="spin text-primary" />
                    <p>正在检查更新...</p>
                </div>
            );
        }

        if (status === 'uptodate') {
            return (
                <div className="update-modal__status-state">
                    <CheckCircle size={48} className="text-success" style={{ color: '#10B981' }} />
                    <h4>当前已是最新版本</h4>
                    <p className="text-secondary">v{versionInfo.current}</p>
                </div>
            );
        }

        if (status === 'error') {
            return (
                <div className="update-modal__status-state">
                    <AlertCircle size={48} className="text-error" style={{ color: '#EF4444' }} />
                    <h4>检查更新失败</h4>
                    <p className="text-secondary">请稍后重试</p>
                </div>
            );
        }

        // status === 'available'
        return (
            <>
                <div className="update-modal__comparison">
                    <div className="version-box current">
                        <span className="label">当前版本</span>
                        <span className="value">v{versionInfo.current}</span>
                    </div>
                    <ArrowRight size={20} className="arrow" />
                    <div className="version-box new">
                        <span className="label">最新版本</span>
                        <span className="value">v{versionInfo.new}</span>
                    </div>
                </div>

                {versionInfo.body && (
                    <div className="update-modal__notes">
                        <h4>更新内容:</h4>
                        <div className="notes-scroll">
                            <pre>{versionInfo.body}</pre>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal__header">
                    <div className="update-modal__icon">
                        <Sparkles size={24} className="text-secondary" />
                    </div>
                    <div className="update-modal__title-area">
                        <h3>版本更新</h3>
                    </div>
                    {!isUpdating && (
                        <button className="update-modal__close" onClick={closeUpdateModal}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="update-modal__content">
                    {renderContent()}
                </div>

                <div className="update-modal__footer">
                    {isUpdating ? (
                        <div className="update-progress">
                            <RefreshCcw size={18} className="spin" />
                            <span>正在更新... {progress > 0 && `${progress}%`}</span>
                        </div>
                    ) : (
                        status === 'available' ? (
                            <>
                                <button className="btn-ghost" onClick={closeUpdateModal}>
                                    忽略
                                </button>
                                <button className="btn-primary" onClick={handleUpdate}>
                                    <Download size={18} />
                                    立即更新
                                </button>
                            </>
                        ) : (
                            <button className="btn-primary" onClick={closeUpdateModal}>
                                确定
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
