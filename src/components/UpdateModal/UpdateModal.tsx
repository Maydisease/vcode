import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { X, Download, RefreshCcw, Loader2, Code2, RotateCcw } from 'lucide-react';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from '../Toast/Toast';
import './UpdateModal.css';

export function UpdateModal() {
    const { updateModal, closeUpdateModal, setUpdateStatus } = useUIStore();
    const { isOpen, versionInfo, updateHandle, status } = updateModal;
    const [isUpdating, setIsUpdating] = useState(false);
    const [progress, setProgress] = useState(0);

    if (!isOpen || !versionInfo) return null;

    const isLatest = status === 'uptodate';
    const hasUpdate = status === 'available';
    const isChecking = status === 'checking';
    const hasError = status === 'error';
    const isDownloaded = status === 'downloaded';

    const handleUpdate = async () => {
        if (!updateHandle || !hasUpdate) return;
        setIsUpdating(true);
        setProgress(0);
        try {
            let totalReceived = 0;
            await updateHandle.downloadAndInstall((event) => {
                if (event.event === 'Progress') {
                    const data = event.data as any;
                    if (data.contentLength && data.chunkLength) {
                        totalReceived += data.chunkLength;
                        setProgress(Math.min(100, Math.round((totalReceived / data.contentLength) * 100)));
                    }
                }
            });
            // 下载安装完成，切换到确认重启状态
            setIsUpdating(false);
            setUpdateStatus('downloaded');
            toast.success('更新已安装，重启后生效');
        } catch (error) {
            console.error('Update failed:', error);
            setIsUpdating(false);
            setProgress(0);
            toast.error('更新失败，请重试');
        }
    };

    const handleRestart = async () => {
        await relaunch();
    };

    const handleLater = () => {
        closeUpdateModal();
    };

    const getLatestVersion = () => {
        if (isChecking) return '检查中...';
        if (hasError) return '检查失败';
        return versionInfo.new ? `v${versionInfo.new}` : `v${versionInfo.current}`;
    };

    return (
        <div className="update-modal-overlay" onClick={isDownloaded ? undefined : closeUpdateModal}>
            <div className="update-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button - 不在已下载状态显示 */}
                {!isUpdating && !isDownloaded && (
                    <button className="update-modal__close" onClick={closeUpdateModal} aria-label="关闭">
                        <X size={16} />
                    </button>
                )}

                {/* Main Content - Horizontal Layout */}
                <div className="update-modal__content">
                    {/* Left: App Icon */}
                    <div className="update-modal__icon">
                        <Code2 size={28} strokeWidth={2} />
                    </div>

                    {/* Right: Version Info & Action */}
                    <div className="update-modal__info">
                        <h2 className="update-modal__title">
                            {isDownloaded ? '更新已安装' : '软件更新'}
                        </h2>

                        <div className="update-modal__versions">
                            <p className="update-modal__version-row">
                                <span className="update-modal__label">当前版本</span>
                                <span className="update-modal__value">v{versionInfo.current}</span>
                            </p>
                            <p className="update-modal__version-row">
                                <span className="update-modal__label">最新版本</span>
                                <span className={`update-modal__value ${hasUpdate || isDownloaded ? 'update-modal__value--new' : ''}`}>
                                    {isChecking && <Loader2 size={12} className="spin" />}
                                    {getLatestVersion()}
                                </span>
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="update-modal__action-area">
                            {isUpdating ? (
                                <div className="update-modal__progress">
                                    <div className="update-modal__progress-bar">
                                        <div
                                            className="update-modal__progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="update-modal__progress-text">
                                        <RefreshCcw size={12} className="spin" />
                                        下载中 {progress}%
                                    </span>
                                </div>
                            ) : isDownloaded ? (
                                <div className="update-modal__confirm-actions">
                                    <button className="update-modal__btn update-modal__btn--primary" onClick={handleRestart}>
                                        <RotateCcw size={12} />
                                        <span>立即重启</span>
                                    </button>
                                    <button className="update-modal__btn update-modal__btn--ghost" onClick={handleLater}>
                                        <span>稍后</span>
                                    </button>
                                </div>
                            ) : isLatest ? (
                                <span className="update-modal__status-text update-modal__status-text--success">
                                    ✓ 已是最新版本
                                </span>
                            ) : hasError ? (
                                <button className="update-modal__btn" onClick={closeUpdateModal}>
                                    <span>关闭</span>
                                </button>
                            ) : hasUpdate ? (
                                <button className="update-modal__btn" onClick={handleUpdate}>
                                    <Download size={12} />
                                    <span>立即更新</span>
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
