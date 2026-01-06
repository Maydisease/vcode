
import { useState, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import './ModelConfig.css'; // Reuse existing styles for consistency

export function ApifoxConfig() {
    const {
        apifoxToken,
        apifoxProjects,
        setApifoxToken,
        addApifoxProject,
        removeApifoxProject
    } = useSettingsStore();

    const [newProjectId, setNewProjectId] = useState('');
    const [newProjectName, setNewProjectName] = useState('');

    const handleAddProject = useCallback(() => {
        if (newProjectId && newProjectName) {
            addApifoxProject({ projectId: newProjectId, name: newProjectName });
            setNewProjectId('');
            setNewProjectName('');
        }
    }, [newProjectId, newProjectName, addApifoxProject]);

    return (
        <div className="model-config">
            <div className="model-config__section">
                <h2 className="model-config__title">Apifox 配置</h2>
                <p className="model-config__desc">
                    配置 Apifox 访问令牌和项目列表
                </p>

                <div className="model-config__card">
                    <div className="model-config__field">
                        <label className="model-config__label">Apifox Access Token</label>
                        <input
                            type="password"
                            className="model-config__input"
                            value={apifoxToken}
                            onChange={(e) => setApifoxToken(e.target.value)}
                            placeholder="输入 Apifox Access Token..."
                        />
                        <p className="model-config__hint">
                            在 Apifox 账户设置 → API 访问令牌中获取
                        </p>
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">项目列表</label>
                        <div className="model-config__list">
                            {apifoxProjects.map((project) => (
                                <div key={project.projectId} className="model-config__list-item">
                                    <div className="model-config__list-info">
                                        <span className="model-config__list-name">{project.name}</span>
                                        <span className="model-config__list-id">({project.projectId})</span>
                                    </div>
                                    <button
                                        className="model-config__icon-btn model-config__icon-btn--danger"
                                        onClick={() => removeApifoxProject(project.projectId)}
                                        title="删除项目"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {apifoxProjects.length === 0 && (
                                <div className="model-config__empty">暂无配置的项目</div>
                            )}
                        </div>
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">添加项目</label>
                        <div className="model-config__row">
                            <input
                                type="text"
                                className="model-config__input"
                                placeholder="项目 ID (如 2677228)"
                                value={newProjectId}
                                onChange={(e) => setNewProjectId(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <input
                                type="text"
                                className="model-config__input"
                                placeholder="项目名称 (如 My Project)"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="model-config__btn"
                                onClick={handleAddProject}
                                disabled={!newProjectId || !newProjectName}
                            >
                                <Plus size={14} />
                                添加
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
