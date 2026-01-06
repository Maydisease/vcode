import { useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, Server, Radio, Key } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ProxyRule, HostGroup } from '../../types';

interface EditingRule {
    id: string | null;
    prefix: string;
    target: string;
}

interface EditingHost {
    id: string | null;
    name: string;
    host: string;
    tokenId?: string;
}

export function ProxyConfig() {
    const {
        proxyRules, addProxyRule, updateProxyRule, deleteProxyRule, toggleProxyRule,
        hostGroups, addHostGroup, updateHostGroup, deleteHostGroup, setActiveHostGroup
    } = useSettingsStore();

    // Proxy rules state
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [newRule, setNewRule] = useState({ prefix: '', target: '{{HOST}}' });
    const [editingRule, setEditingRule] = useState<EditingRule | null>(null);

    // Host groups state
    const [isAddingHost, setIsAddingHost] = useState(false);
    const [newHost, setNewHost] = useState<{ name: string; host: string; tokenId?: string }>({ name: '', host: '', tokenId: '' });
    const [editingHost, setEditingHost] = useState<EditingHost | null>(null);

    // Get active host for display in rules
    const activeHost = hostGroups.find(h => h.isActive);

    // Host group handlers
    const handleAddHost = useCallback(() => {
        if (!newHost.name.trim() || !newHost.host.trim()) return;

        addHostGroup({
            name: newHost.name.trim(),
            host: newHost.host.trim(),
            tokenId: newHost.tokenId?.trim(),
            isActive: hostGroups.length === 0, // First one is active by default
        });

        setNewHost({ name: '', host: '', tokenId: '' });
        setIsAddingHost(false);
    }, [newHost, addHostGroup, hostGroups.length]);

    const handleEditHost = useCallback((host: HostGroup) => {
        setEditingHost({
            id: host.id,
            name: host.name,
            host: host.host,
            tokenId: host.tokenId,
        });
    }, []);

    const handleSaveEditHost = useCallback(() => {
        if (!editingHost || !editingHost.id) return;
        if (!editingHost.name.trim() || !editingHost.host.trim()) return;

        updateHostGroup(editingHost.id, {
            name: editingHost.name.trim(),
            host: editingHost.host.trim(),
            tokenId: editingHost.tokenId?.trim(),
        });

        setEditingHost(null);
    }, [editingHost, updateHostGroup]);

    const handleDeleteHost = useCallback((id: string) => {
        deleteHostGroup(id);
    }, [deleteHostGroup]);

    // Proxy rule handlers
    const handleAddRule = useCallback(() => {
        if (!newRule.prefix.trim() || !newRule.target.trim()) return;

        addProxyRule({
            prefix: newRule.prefix.trim(),
            target: newRule.target.trim(),
            enabled: true,
        });

        setNewRule({ prefix: '', target: '{{HOST}}' });
        setIsAddingRule(false);
    }, [newRule, addProxyRule]);

    const handleEditRule = useCallback((rule: ProxyRule) => {
        setEditingRule({
            id: rule.id,
            prefix: rule.prefix,
            target: rule.target,
        });
    }, []);

    const handleSaveEditRule = useCallback(() => {
        if (!editingRule || !editingRule.id) return;
        if (!editingRule.prefix.trim() || !editingRule.target.trim()) return;

        updateProxyRule(editingRule.id, {
            prefix: editingRule.prefix.trim(),
            target: editingRule.target.trim(),
        });

        setEditingRule(null);
    }, [editingRule, updateProxyRule]);

    const handleCancelEditRule = useCallback(() => {
        setEditingRule(null);
    }, []);

    const handleDeleteRule = useCallback((id: string) => {
        deleteProxyRule(id);
    }, [deleteProxyRule]);

    // Helper to resolve {{HOST}} variable for preview
    const resolveHostVariable = (target: string): string => {
        if (!activeHost) return target;
        return target.replace(/\{\{HOST\}\}/g, activeHost.host);
    };

    return (
        <div className="proxy-config">
            {/* Host Groups Section */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <h2 className="settings-section__title">
                        <Server size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        服务器环境
                    </h2>
                    <p className="settings-section__description">
                        管理多个服务器环境，快速切换 Host 地址。选中的环境可快速应用到代理规则。
                    </p>
                </div>

                <div className="proxy-config__host-list">
                    {hostGroups.length === 0 && !isAddingHost && (
                        <div className="proxy-config__empty">
                            暂无服务器环境，点击下方按钮添加
                        </div>
                    )}

                    {hostGroups.map((host) => (
                        <div
                            key={host.id}
                            className={`proxy-config__host-item ${host.isActive ? 'proxy-config__host-item--active' : ''}`}
                        >
                            {editingHost?.id === host.id ? (
                                <div className="proxy-config__item-editing">
                                    <input
                                        type="text"
                                        className="proxy-config__input"
                                        placeholder="名称，如 开发环境"
                                        value={editingHost.name}
                                        onChange={(e) => setEditingHost({ ...editingHost, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="proxy-config__input proxy-config__input--target"
                                        placeholder="地址，如 https://172.20.66.66:2505"
                                        value={editingHost.host}
                                        onChange={(e) => setEditingHost({ ...editingHost, host: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="proxy-config__input proxy-config__input--token"
                                        placeholder="Cookie TokenId (选填)"
                                        value={editingHost.tokenId || ''}
                                        onChange={(e) => setEditingHost({ ...editingHost, tokenId: e.target.value })}
                                    />
                                    <div className="proxy-config__item-actions">
                                        <button className="proxy-config__btn proxy-config__btn--save" onClick={handleSaveEditHost}>
                                            <Check size={14} />
                                        </button>
                                        <button className="proxy-config__btn proxy-config__btn--cancel" onClick={() => setEditingHost(null)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className="proxy-config__host-select"
                                        onClick={() => setActiveHostGroup(host.id)}
                                        title={host.isActive ? '当前选中' : '点击选择'}
                                    >
                                        <Radio size={16} className={host.isActive ? 'proxy-config__radio--active' : ''} />
                                    </button>
                                    <div className="proxy-config__host-content" onClick={() => setActiveHostGroup(host.id)}>
                                        <span className="proxy-config__host-name">{host.name}</span>
                                        <code className="proxy-config__host-url">{host.host}</code>
                                        {host.tokenId && (
                                            <span className="proxy-config__host-token" title="TokenId">
                                                <Key size={10} />
                                                cookie -&gt; tokenId={host.tokenId}
                                            </span>
                                        )}
                                    </div>
                                    <div className="proxy-config__item-actions">
                                        <button
                                            className="proxy-config__btn proxy-config__btn--edit"
                                            onClick={() => handleEditHost(host)}
                                            title="编辑"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="proxy-config__btn proxy-config__btn--delete"
                                            onClick={() => handleDeleteHost(host.id)}
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {isAddingHost && (
                        <div className="proxy-config__host-item proxy-config__host-item--new">
                            <div className="proxy-config__item-editing">
                                <input
                                    type="text"
                                    className="proxy-config__input"
                                    placeholder="名称，如 开发环境"
                                    value={newHost.name}
                                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    className="proxy-config__input proxy-config__input--target"
                                    placeholder="地址，如 https://172.20.66.66:2505"
                                    value={newHost.host}
                                    onChange={(e) => setNewHost({ ...newHost, host: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="proxy-config__input proxy-config__input--token"
                                    placeholder="Cookie TokenId (选填)"
                                    value={newHost.tokenId || ''}
                                    onChange={(e) => setNewHost({ ...newHost, tokenId: e.target.value })}
                                />
                                <div className="proxy-config__item-actions">
                                    <button className="proxy-config__btn proxy-config__btn--save" onClick={handleAddHost}>
                                        <Check size={14} />
                                    </button>
                                    <button className="proxy-config__btn proxy-config__btn--cancel" onClick={() => setIsAddingHost(false)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isAddingHost && (
                    <button className="proxy-config__add-btn" onClick={() => setIsAddingHost(true)}>
                        <Plus size={16} />
                        添加服务器环境
                    </button>
                )}
            </div>

            {/* Proxy Rules Section */}
            <div className="settings-section" style={{ marginTop: 24 }}>
                <div className="settings-section__header">
                    <h2 className="settings-section__title">代理规则</h2>
                    <p className="settings-section__description">
                        配置 URL 前缀到目标服务器的代理映射。使用 <code>{`{{HOST}}`}</code> 变量引用当前激活的服务器环境。
                        {activeHost && (
                            <span className="proxy-config__active-hint">
                                当前环境: <strong>{activeHost.name}</strong> ({activeHost.host})
                            </span>
                        )}
                    </p>
                </div>

                <div className="proxy-config__list">
                    {proxyRules.length === 0 && !isAddingRule && (
                        <div className="proxy-config__empty">
                            暂无代理规则，点击下方按钮添加
                        </div>
                    )}

                    {proxyRules.map((rule) => (
                        <div key={rule.id} className={`proxy-config__item ${!rule.enabled ? 'proxy-config__item--disabled' : ''}`}>
                            {editingRule?.id === rule.id ? (
                                <div className="proxy-config__item-editing">
                                    <input
                                        type="text"
                                        className="proxy-config__input"
                                        placeholder="前缀，如 /dist"
                                        value={editingRule.prefix}
                                        onChange={(e) => setEditingRule({ ...editingRule, prefix: e.target.value })}
                                    />
                                    <span className="proxy-config__arrow">→</span>
                                    <input
                                        type="text"
                                        className="proxy-config__input proxy-config__input--target"
                                        placeholder="目标地址"
                                        value={editingRule.target}
                                        onChange={(e) => setEditingRule({ ...editingRule, target: e.target.value })}
                                    />
                                    <div className="proxy-config__item-actions">
                                        <button className="proxy-config__btn proxy-config__btn--save" onClick={handleSaveEditRule}>
                                            <Check size={14} />
                                        </button>
                                        <button className="proxy-config__btn proxy-config__btn--cancel" onClick={handleCancelEditRule}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="proxy-config__item-content">
                                        <code className="proxy-config__prefix">{rule.prefix}</code>
                                        <span className="proxy-config__arrow">→</span>
                                        <div className="proxy-config__target-wrapper">
                                            <code className="proxy-config__target">{rule.target}</code>
                                            {rule.target.includes('{{HOST}}') && activeHost && (
                                                <span className="proxy-config__resolved">
                                                    = {resolveHostVariable(rule.target)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="proxy-config__item-actions">
                                        <button
                                            className="proxy-config__btn proxy-config__btn--toggle"
                                            onClick={() => toggleProxyRule(rule.id)}
                                            title={rule.enabled ? '禁用' : '启用'}
                                        >
                                            {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button
                                            className="proxy-config__btn proxy-config__btn--edit"
                                            onClick={() => handleEditRule(rule)}
                                            title="编辑"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="proxy-config__btn proxy-config__btn--delete"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {isAddingRule && (
                        <div className="proxy-config__item proxy-config__item--new">
                            <div className="proxy-config__item-editing">
                                <input
                                    type="text"
                                    className="proxy-config__input"
                                    placeholder="前缀，如 /dist"
                                    value={newRule.prefix}
                                    onChange={(e) => setNewRule({ ...newRule, prefix: e.target.value })}
                                    autoFocus
                                />
                                <span className="proxy-config__arrow">→</span>
                                <div className="proxy-config__target-input-group">
                                    <span className="proxy-config__host-tag">{'{{HOST}}'}</span>
                                    <input
                                        type="text"
                                        className="proxy-config__input proxy-config__input--path"
                                        placeholder="/path"
                                        value={newRule.target.replace('{{HOST}}', '')}
                                        onChange={(e) => setNewRule({ ...newRule, target: '{{HOST}}' + e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="proxy-config__item-actions">
                                <button className="proxy-config__btn proxy-config__btn--save" onClick={handleAddRule}>
                                    <Check size={14} />
                                </button>
                                <button className="proxy-config__btn proxy-config__btn--cancel" onClick={() => setIsAddingRule(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!isAddingRule && (
                    <button className="proxy-config__add-btn" onClick={() => setIsAddingRule(true)}>
                        <Plus size={16} />
                        添加代理规则
                    </button>
                )}
            </div>
        </div >
    );
}
