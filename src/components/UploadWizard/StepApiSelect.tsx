import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link2, RefreshCw, Loader2, Clock } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
    fetchApifoxOpenAPI,
    parseOpenAPIEndpoints,
    formatEndpointForPrompt,
    type ApifoxEndpoint,
} from '../../services/apifoxService';
import { SearchableSelect } from '../ApiSelector/SearchableSelect';
import type { SelectedApis } from '../ApiSelector/ApiSelector';

// Cache key for localStorage
const CACHE_KEY = 'vcode-apifox-cache';
const SELECTION_CACHE_KEY = 'vcode-api-selection';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ApifoxCache {
    endpoints: ApifoxEndpoint[];
    lastUpdated: number;
}

interface SelectionCache {
    createApiId: string;
    updateApiId: string;
    queryApiId: string;
    columnsCode: string;
}

function loadFromCache(): ApifoxCache | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached) as ApifoxCache;
        }
    } catch (e) {
        console.error('Failed to load cache:', e);
    }
    return null;
}

function saveToCache(endpoints: ApifoxEndpoint[]): void {
    const cache: ApifoxCache = {
        endpoints,
        lastUpdated: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function isCacheValid(cache: ApifoxCache | null): boolean {
    if (!cache) return false;
    return (Date.now() - cache.lastUpdated) < CACHE_EXPIRY_MS;
}

function loadSelectionCache(): SelectionCache | null {
    try {
        const cached = localStorage.getItem(SELECTION_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached) as SelectionCache;
        }
    } catch (e) {
        console.error('Failed to load selection cache:', e);
    }
    return null;
}

function saveSelectionCache(selection: SelectionCache): void {
    localStorage.setItem(SELECTION_CACHE_KEY, JSON.stringify(selection));
}

function formatLastUpdated(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

interface ApiSelectorContentProps {
    onConfirm: (apis: SelectedApis) => void;
    onSkip: () => void;
    hideActions?: boolean;
}

export function ApiSelectorContent({ onConfirm, onSkip, hideActions }: ApiSelectorContentProps) {
    const { apifoxToken, apifoxProjects } = useSettingsStore();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [endpoints, setEndpoints] = useState<ApifoxEndpoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const [createApiId, setCreateApiId] = useState<string>('');
    const [updateApiId, setUpdateApiId] = useState<string>('');
    const [deleteApiId, setDeleteApiId] = useState<string>('');
    const [queryApiId, setQueryApiId] = useState<string>('');
    const [columnsCode, setColumnsCode] = useState<string>('');

    useEffect(() => {
        if (!selectedProjectId && apifoxProjects.length > 0) {
            setSelectedProjectId(apifoxProjects[0].projectId);
        }
    }, [apifoxProjects, selectedProjectId]);

    const restoreSelection = useCallback((endpointList: ApifoxEndpoint[]) => {
        const cached = loadSelectionCache();
        if (!cached) return;

        const endpointIds = new Set(endpointList.map(e => e.id));

        if (cached.createApiId && endpointIds.has(cached.createApiId)) {
            setCreateApiId(cached.createApiId);
        }
        if (cached.updateApiId && endpointIds.has(cached.updateApiId)) {
            setUpdateApiId(cached.updateApiId);
        }
        if (cached.queryApiId && endpointIds.has(cached.queryApiId)) {
            setQueryApiId(cached.queryApiId);
        }
        if (cached.columnsCode) {
            setColumnsCode(cached.columnsCode);
        }
    }, []);

    const fetchAndCacheEndpoints = useCallback(async () => {
        if (!apifoxToken || !selectedProjectId) {
            setError('请先在设置中配置 Apifox Token 和项目');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const openApiSpec = await fetchApifoxOpenAPI(selectedProjectId, apifoxToken);
            const parsedEndpoints = parseOpenAPIEndpoints(openApiSpec);
            setEndpoints(parsedEndpoints);
            saveToCache(parsedEndpoints);
            setLastUpdated(Date.now());

            const endpointIds = new Set(parsedEndpoints.map(e => e.id));
            setCreateApiId(prev => endpointIds.has(prev) ? prev : '');
            setUpdateApiId(prev => endpointIds.has(prev) ? prev : '');
            setQueryApiId(prev => endpointIds.has(prev) ? prev : '');
        } catch (err) {
            setError(err instanceof Error ? err.message : '获取接口列表失败');
        } finally {
            setLoading(false);
        }
    }, [apifoxToken, selectedProjectId]);

    const loadEndpoints = useCallback(async () => {
        const cache = loadFromCache();

        if (isCacheValid(cache)) {
            setEndpoints(cache!.endpoints);
            setLastUpdated(cache!.lastUpdated);
            restoreSelection(cache!.endpoints);
        } else {
            await fetchAndCacheEndpoints();
        }
    }, [fetchAndCacheEndpoints, restoreSelection]);

    const handleForceRefresh = useCallback(() => {
        fetchAndCacheEndpoints();
    }, [fetchAndCacheEndpoints]);

    useEffect(() => {
        if (selectedProjectId) {
            loadEndpoints();
        }
    }, [loadEndpoints, selectedProjectId]);

    useEffect(() => {
        if (endpoints.length > 0) {
            saveSelectionCache({
                createApiId,
                updateApiId,
                queryApiId,
                columnsCode,
            });
        }
    }, [createApiId, updateApiId, queryApiId, columnsCode, endpoints.length]);

    const getEndpointById = useCallback((id: string) => endpoints.find(e => e.id === id) || null, [endpoints]);

    const selectedApis = useMemo<SelectedApis>(() => ({
        createApi: getEndpointById(createApiId),
        updateApi: getEndpointById(updateApiId),
        deleteApi: getEndpointById(deleteApiId),
        queryApi: getEndpointById(queryApiId),
        columnsCode,
    }), [createApiId, updateApiId, deleteApiId, queryApiId, columnsCode, getEndpointById]);

    const hasSelection = createApiId || updateApiId;

    const handleConfirm = () => {
        onConfirm(selectedApis);
    };

    const previewText = useMemo(() => {
        const parts: string[] = [];
        if (selectedApis.createApi) {
            parts.push(`=== 添加接口 ===\n${formatEndpointForPrompt(selectedApis.createApi)}`);
        }
        if (selectedApis.updateApi) {
            parts.push(`=== 修改接口 ===\n${formatEndpointForPrompt(selectedApis.updateApi)}`);
        }
        if (selectedApis.queryApi) {
            parts.push(`=== 查询接口 ===\n${formatEndpointForPrompt(selectedApis.queryApi)}`);
        }
        if (selectedApis.columnsCode) {
            parts.push(`=== 表格列定义 (columnsCode) ===\n${selectedApis.columnsCode}`);
        }
        return parts.join('\n\n');
    }, [selectedApis]);

    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text;
        const index = text.toLowerCase().indexOf(search.toLowerCase());
        if (index === -1) return text;
        return (
            <>
                {text.slice(0, index)}
                <span className="searchable-select__highlight">
                    {text.slice(index, index + search.length)}
                </span>
                {text.slice(index + search.length)}
            </>
        );
    };

    const renderApiOption = (opt: ApifoxEndpoint, searchText: string) => (
        <>
            <div className="searchable-select__option-main">
                <span className={`api-selector__option-method api-selector__option-method--${opt.method.toLowerCase()}`}>
                    {opt.method}
                </span>
                <span className="api-selector__option-path">
                    {highlightMatch(opt.path, searchText)}
                </span>
            </div>
            {opt.summary && (
                <div className="api-selector__option-summary">
                    {highlightMatch(opt.summary, searchText)}
                </div>
            )}
        </>
    );

    const getApiLabel = (opt: ApifoxEndpoint) => `${opt.method} ${opt.path}`;
    const getApiValue = (opt: ApifoxEndpoint) => opt.id;

    if (loading && endpoints.length === 0) {
        return (
            <div className="api-selector">
                <div className="api-selector__loading">
                    <Loader2 size={24} className="animate-spin" />
                    <span>正在获取接口列表...</span>
                </div>
            </div>
        );
    }

    if ((!apifoxToken || apifoxProjects.length === 0) && endpoints.length === 0) {
        return (
            <div className="api-selector">
                <div className="api-selector__header">
                    <div className="api-selector__title">
                        <Link2 size={16} />
                        <span>选择关联配置</span>
                    </div>
                </div>
                <div className="api-selector__error">
                    请先在设置中配置 Apifox Token 和项目信息
                </div>
                {!hideActions && (
                    <div className="api-selector__actions">
                        <button className="api-selector__btn api-selector__btn--secondary" onClick={onSkip}>
                            跳过
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (error && endpoints.length === 0) {
        return (
            <div className="api-selector">
                <div className="api-selector__header">
                    <div className="api-selector__title">
                        <Link2 size={16} />
                        <span>选择关联配置</span>
                    </div>
                </div>
                <div className="api-selector__error">{error}</div>
                {!hideActions && (
                    <div className="api-selector__actions">
                        <button className="api-selector__btn api-selector__btn--secondary" onClick={handleForceRefresh}>
                            重试
                        </button>
                        <button className="api-selector__btn api-selector__btn--secondary" onClick={onSkip}>
                            跳过
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="api-selector">
            <div className="api-selector__header">
                <div className="api-selector__title">
                    <Link2 size={16} />
                    <span>选择关联配置</span>
                    <span className="api-selector__count">({endpoints.length} 个接口)</span>
                </div>

                <div className="api-selector__header-actions">
                    {lastUpdated && (
                        <span className="api-selector__last-updated">
                            <Clock size={12} />
                            {formatLastUpdated(lastUpdated)}
                        </span>
                    )}
                    <button
                        className="api-selector__refresh"
                        onClick={handleForceRefresh}
                        disabled={loading}
                        title="强制刷新接口列表"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        刷新
                    </button>
                </div>
            </div>

            <div className="api-selector__fields">
                {apifoxProjects.length > 0 && (
                    <div className="api-selector__field">
                        <label className="api-selector__label">选择项目</label>
                        <SearchableSelect
                            value={selectedProjectId}
                            onChange={setSelectedProjectId}
                            options={apifoxProjects}
                            placeholder="选择项目"
                            getValue={(p) => p.projectId}
                            getLabel={(p) => p.name}
                            disabled={loading}
                        />
                    </div>
                )}

                <div className="api-selector__field">
                    <label className="api-selector__label">添加接口</label>
                    <SearchableSelect<ApifoxEndpoint>
                        value={createApiId}
                        onChange={setCreateApiId}
                        options={endpoints.filter(e => e.method === 'POST')}
                        placeholder="输入关键字搜索..."
                        getValue={getApiValue}
                        getLabel={getApiLabel}
                        renderOption={renderApiOption}
                    />
                </div>

                <div className="api-selector__field">
                    <label className="api-selector__label">修改接口</label>
                    <SearchableSelect<ApifoxEndpoint>
                        value={updateApiId}
                        onChange={setUpdateApiId}
                        options={endpoints.filter(e => ['POST', 'PUT', 'PATCH'].includes(e.method))}
                        placeholder="输入关键字搜索..."
                        getValue={getApiValue}
                        getLabel={getApiLabel}
                        renderOption={renderApiOption}
                    />
                </div>

                <div className="api-selector__field">
                    <label className="api-selector__label">查询接口 (可选)</label>
                    <SearchableSelect<ApifoxEndpoint>
                        value={queryApiId}
                        onChange={setQueryApiId}
                        options={endpoints}
                        placeholder="输入关键字搜索..."
                        getValue={getApiValue}
                        getLabel={getApiLabel}
                        renderOption={renderApiOption}
                    />
                </div>

                <div className="api-selector__field">
                    <label className="api-selector__label">删除接口 (可选)</label>
                    <SearchableSelect<ApifoxEndpoint>
                        value={deleteApiId}
                        onChange={setDeleteApiId}
                        options={endpoints.filter(e => ['POST', 'DELETE'].includes(e.method))}
                        placeholder="输入关键字搜索..."
                        getValue={getApiValue}
                        getLabel={getApiLabel}
                        renderOption={renderApiOption}
                    />
                </div>

                <div className="api-selector__field">
                    <label className="api-selector__label">Table Columns ID (columnsCode)</label>
                    <input
                        type="text"
                        className="api-selector__input"
                        value={columnsCode}
                        onChange={(e) => setColumnsCode(e.target.value)}
                        placeholder="请输入 columnsCode (例如: 8ef6f6a10b)"
                    />
                </div>
            </div>

            {hasSelection && (
                <div className="api-selector__preview">
                    <div className="api-selector__preview-title">已选接口参数预览</div>
                    <div className="api-selector__preview-editor">
                        <Editor
                            height="200px"
                            language="yaml"
                            theme="vs"
                            value={previewText || '// 请选择接口'}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                lineNumbers: 'off',
                                folding: false,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                padding: { top: 12, bottom: 12 },
                            }}
                        />
                    </div>
                </div>
            )}

            {!hideActions && (
                <div className="api-selector__actions">
                    <button className="api-selector__btn api-selector__btn--secondary" onClick={onSkip}>
                        跳过
                    </button>
                    <button
                        className="api-selector__btn api-selector__btn--primary"
                        onClick={handleConfirm}
                        disabled={!hasSelection}
                    >
                        确认并生成代码
                    </button>
                </div>
            )}

            {/* Hidden confirm button for wizard to trigger */}
            {hideActions && hasSelection && (
                <button
                    id="wizard-api-confirm-btn"
                    style={{ display: 'none' }}
                    onClick={handleConfirm}
                />
            )}
        </div>
    );
}
