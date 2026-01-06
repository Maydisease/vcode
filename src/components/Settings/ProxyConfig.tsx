import { useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, Server, Radio, Key, ChevronRight, Globe } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ProxyRule, HostGroup } from '../../types';
import './ProxyConfig.css';

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
            isActive: hostGroups.length === 0,
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
            {/* Server Environment Section */}
            <div className="proxy-config__section">
                <div className="proxy-config__section-header">
                    <div className="proxy-config__section-title">
                        <Server size={18} />
                        <span>服务器环境</span>
                    </div>
                    {!isAddingHost && (
                        <button
                            className="proxy-config__section-action"
                            onClick={() => setIsAddingHost(true)}
                        >
                            <Plus size={16} />
                            添加
                        </button>
                    )}
                </div>

                <div className="proxy-config__server-grid">
                    {hostGroups.length === 0 && !isAddingHost && (
                        <div className="proxy-config__empty-state">
                            <Globe size={32} />
                            <span>暂无服务器环境</span>
                            <button onClick={() => setIsAddingHost(true)}>添加第一个环境</button>
                        </div>
                    )}

                    {hostGroups.map((host) => (
                        <div
                            key={host.id}
                            className={`proxy-config__server-card ${host.isActive ? 'proxy-config__server-card--active' : ''}`}
                            onClick={() => !editingHost && setActiveHostGroup(host.id)}
                        >
                            {editingHost?.id === host.id ? (
                                <div className="proxy-config__server-card-edit">
                                    <input
                                        type="text"
                                        placeholder="环境名称"
                                        value={editingHost.name}
                                        onChange={(e) => setEditingHost({ ...editingHost, name: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        placeholder="https://example.com"
                                        value={editingHost.host}
                                        onChange={(e) => setEditingHost({ ...editingHost, host: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <input
                                        type="text"
                                        placeholder="TokenId (选填)"
                                        value={editingHost.tokenId || ''}
                                        onChange={(e) => setEditingHost({ ...editingHost, tokenId: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="proxy-config__server-card-edit-actions">
                                        <button className="proxy-config__btn--confirm" onClick={(e) => { e.stopPropagation(); handleSaveEditHost(); }}>
                                            <Check size={16} /> 保存
                                        </button>
                                        <button className="proxy-config__btn--cancel" onClick={(e) => { e.stopPropagation(); setEditingHost(null); }}>
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="proxy-config__server-card-indicator">
                                        <Radio size={16} className={host.isActive ? 'active' : ''} />
                                    </div>
                                    <div className="proxy-config__server-card-info">
                                        <div className="proxy-config__server-card-name">{host.name}</div>
                                        <div className="proxy-config__server-card-url">{host.host}</div>
                                        {host.tokenId && (
                                            <div className="proxy-config__server-card-token">
                                                <Key size={10} />
                                                <span>tokenId: {host.tokenId}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="proxy-config__server-card-actions">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditHost(host); }} title="编辑">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteHost(host.id); }} title="删除" className="delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {isAddingHost && (
                        <div className="proxy-config__server-card proxy-config__server-card--new">
                            <div className="proxy-config__server-card-edit">
                                <input
                                    type="text"
                                    placeholder="环境名称，如：开发环境"
                                    value={newHost.name}
                                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="服务器地址，如：https://172.20.66.66:2505"
                                    value={newHost.host}
                                    onChange={(e) => setNewHost({ ...newHost, host: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Cookie TokenId (选填)"
                                    value={newHost.tokenId || ''}
                                    onChange={(e) => setNewHost({ ...newHost, tokenId: e.target.value })}
                                />
                                <div className="proxy-config__server-card-edit-actions">
                                    <button className="proxy-config__btn--confirm" onClick={handleAddHost}>
                                        <Check size={16} /> 添加
                                    </button>
                                    <button className="proxy-config__btn--cancel" onClick={() => setIsAddingHost(false)}>
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Proxy Rules Section */}
            <div className="proxy-config__section">
                <div className="proxy-config__section-header">
                    <div className="proxy-config__section-title">
                        <ChevronRight size={18} />
                        <span>代理规则</span>
                        {activeHost && (
                            <span className="proxy-config__section-badge">{activeHost.name}</span>
                        )}
                    </div>
                    {!isAddingRule && (
                        <button
                            className="proxy-config__section-action"
                            onClick={() => setIsAddingRule(true)}
                        >
                            <Plus size={16} />
                            添加
                        </button>
                    )}
                </div>

                <div className="proxy-config__rules-list">
                    {proxyRules.length === 0 && !isAddingRule && (
                        <div className="proxy-config__empty-state proxy-config__empty-state--small">
                            <span>暂无代理规则</span>
                        </div>
                    )}

                    {proxyRules.map((rule) => (
                        <div key={rule.id} className={`proxy-config__rule-item ${!rule.enabled ? 'proxy-config__rule-item--disabled' : ''}`}>
                            {editingRule?.id === rule.id ? (
                                <div className="proxy-config__rule-item-edit">
                                    <input
                                        type="text"
                                        placeholder="/api"
                                        value={editingRule.prefix}
                                        onChange={(e) => setEditingRule({ ...editingRule, prefix: e.target.value })}
                                        autoFocus
                                    />
                                    <span className="proxy-config__rule-arrow">→</span>
                                    <input
                                        type="text"
                                        placeholder="{{HOST}}/path"
                                        value={editingRule.target}
                                        onChange={(e) => setEditingRule({ ...editingRule, target: e.target.value })}
                                    />
                                    <div className="proxy-config__rule-item-actions">
                                        <button className="save" onClick={handleSaveEditRule}><Check size={14} /></button>
                                        <button onClick={handleCancelEditRule}><X size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="proxy-config__rule-item-content">
                                        <code className="proxy-config__rule-prefix">{rule.prefix}</code>
                                        <span className="proxy-config__rule-arrow">→</span>
                                        <div className="proxy-config__rule-target">
                                            <code>{rule.target}</code>
                                            {rule.target.includes('{{HOST}}') && activeHost && (
                                                <span className="proxy-config__rule-resolved">
                                                    {resolveHostVariable(rule.target)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="proxy-config__rule-item-actions">
                                        <button
                                            className={`toggle ${rule.enabled ? 'on' : ''}`}
                                            onClick={() => toggleProxyRule(rule.id)}
                                            title={rule.enabled ? '禁用' : '启用'}
                                        >
                                            {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button onClick={() => handleEditRule(rule)} title="编辑">
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="delete" onClick={() => handleDeleteRule(rule.id)} title="删除">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {isAddingRule && (
                        <div className="proxy-config__rule-item proxy-config__rule-item--new">
                            <div className="proxy-config__rule-item-edit">
                                <input
                                    type="text"
                                    placeholder="/api"
                                    value={newRule.prefix}
                                    onChange={(e) => setNewRule({ ...newRule, prefix: e.target.value })}
                                    autoFocus
                                />
                                <span className="proxy-config__rule-arrow">→</span>
                                <div className="proxy-config__rule-target-input">
                                    <span className="proxy-config__host-var">{'{{HOST}}'}</span>
                                    <input
                                        type="text"
                                        placeholder="/path"
                                        value={newRule.target.replace('{{HOST}}', '')}
                                        onChange={(e) => setNewRule({ ...newRule, target: '{{HOST}}' + e.target.value })}
                                    />
                                </div>
                                <div className="proxy-config__rule-item-actions">
                                    <button className="save" onClick={handleAddRule}><Check size={14} /></button>
                                    <button onClick={() => setIsAddingRule(false)}><X size={14} /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
