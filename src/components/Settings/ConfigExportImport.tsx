import { useState, useCallback } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import {
    exportConfig,
    importConfigFromDialog,
    applyConfig,
    hasExistingConfig,
    getConfigSummary,
    type ExportableConfig
} from '../../services/configService';
import { toast } from '../Toast/Toast';
import './ConfigExportImport.css';

interface ImportDialogProps {
    config: ExportableConfig;
    onConfirm: () => void;
    onCancel: () => void;
}

function ImportDialog({ config, onConfirm, onCancel }: ImportDialogProps) {
    const summary = getConfigSummary(config);
    const hasExisting = hasExistingConfig();

    return (
        <div className="config-dialog-overlay">
            <div className="config-dialog">
                <div className="config-dialog__header">
                    <h3 className="config-dialog__title">导入配置</h3>
                    <button className="config-dialog__close" onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="config-dialog__content">
                    {hasExisting && (
                        <div className="config-dialog__warning">
                            <AlertTriangle size={18} />
                            <span>当前已有配置，导入将会覆盖现有设置</span>
                        </div>
                    )}

                    <div className="config-dialog__info">
                        <p className="config-dialog__date">
                            导出时间: {summary.exportDate}
                        </p>
                    </div>

                    <div className="config-dialog__summary">
                        <h4>配置内容:</h4>
                        <ul className="config-dialog__list">
                            <li>
                                <CheckCircle size={14} />
                                提示词: {summary.promptCount} 个
                            </li>
                            <li>
                                <CheckCircle size={14} />
                                EasyForm 提示词: 5 个
                            </li>
                            <li>
                                {summary.hasApiKey ? <CheckCircle size={14} /> : <X size={14} />}
                                API 密钥: {summary.hasApiKey ? '已配置' : '未配置'}
                            </li>
                            <li>
                                {summary.hasApifox ? <CheckCircle size={14} /> : <X size={14} />}
                                Apifox: {summary.hasApifox ? '已配置' : '未配置'}
                            </li>
                            <li>
                                <CheckCircle size={14} />
                                最佳例子: {summary.exampleCount} 个
                            </li>
                            <li>
                                <CheckCircle size={14} />
                                代理规则: {summary.proxyRuleCount} 个
                            </li>
                            <li>
                                <CheckCircle size={14} />
                                主机组: {summary.hostGroupCount} 个
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="config-dialog__actions">
                    <button className="config-dialog__btn config-dialog__btn--secondary" onClick={onCancel}>
                        取消
                    </button>
                    <button className="config-dialog__btn config-dialog__btn--primary" onClick={onConfirm}>
                        确认导入
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ConfigExportImport() {
    const [pendingConfig, setPendingConfig] = useState<ExportableConfig | null>(null);

    const handleExport = useCallback(async () => {
        try {
            const success = await exportConfig();
            if (success) {
                toast.success('配置已导出');
            }
        } catch (e) {
            toast.error('导出失败');
            console.error(e);
        }
    }, []);

    const handleImportClick = useCallback(async () => {
        try {
            const config = await importConfigFromDialog();
            if (config) {
                // Show confirmation dialog
                setPendingConfig(config);
            }
        } catch (e) {
            toast.error('配置文件无效或已损坏');
            console.error(e);
        }
    }, []);

    const handleConfirmImport = useCallback(() => {
        if (!pendingConfig) return;

        try {
            applyConfig(pendingConfig);
            toast.success('配置已导入');
            setPendingConfig(null);
        } catch (e) {
            toast.error('导入失败');
            console.error(e);
        }
    }, [pendingConfig]);

    const handleCancelImport = useCallback(() => {
        setPendingConfig(null);
    }, []);

    return (
        <>
            <div className="config-export-import">
                <h3 className="config-export-import__title">配置管理</h3>
                <p className="config-export-import__desc">
                    导出或导入应用配置，方便在不同设备间同步设置
                </p>
                <div className="config-export-import__buttons">
                    <button className="config-export-import__btn config-export-import__btn--export" onClick={handleExport}>
                        <Download size={16} />
                        导出配置
                    </button>
                    <button className="config-export-import__btn config-export-import__btn--import" onClick={handleImportClick}>
                        <Upload size={16} />
                        导入配置
                    </button>
                </div>
            </div>

            {pendingConfig && (
                <ImportDialog
                    config={pendingConfig}
                    onConfirm={handleConfirmImport}
                    onCancel={handleCancelImport}
                />
            )}
        </>
    );
}
