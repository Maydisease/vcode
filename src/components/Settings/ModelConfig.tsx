import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SearchableSelect } from '../ApiSelector/SearchableSelect';
import { useSettingsStore } from '../../stores/settingsStore';
import { testConnection, fetchAvailableModels, type GeminiModel } from '../../services/geminiService';
import { testOpenAIConnection, fetchOpenAIModels, initializeOpenAI } from '../../services/openaiService';
import type { AIProvider } from '../../types';
import './ModelConfig.css';

interface ModelConfigProps {
    activeTab: 'api-key' | 'model-config';
}

// Fallback models for each provider
const FALLBACK_MODELS: Record<AIProvider, Array<{ value: string; label: string }>> = {
    google: [
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4-vision-preview', label: 'GPT-4 Vision' },
    ],
};

const PROVIDER_OPTIONS: Array<{ value: AIProvider; label: string; hint: string }> = [
    { value: 'google', label: 'Google Gemini', hint: 'https://aistudio.google.com/app/apikey' },
    { value: 'openai', label: 'OpenAI 兼容', hint: '支持 OpenAI API 标准的所有服务' },
];

export function ModelConfig({ activeTab }: ModelConfigProps) {
    const { apiKey, modelConfig, setApiKey, updateModelConfig } = useSettingsStore();
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localBaseUrl, setLocalBaseUrl] = useState(modelConfig.openaiBaseUrl || 'https://api.openai.com/v1');
    const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
    const [openaiModels, setOpenaiModels] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);

    const provider = modelConfig.provider || 'google';

    const loadGeminiModels = useCallback(async (key: string) => {
        setIsLoadingModels(true);
        try {
            const models = await fetchAvailableModels(key);
            setAvailableModels(models);
        } catch (error) {
            console.error('Failed to load Gemini models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    }, []);

    const loadOpenAIModels = useCallback(async () => {
        if (!apiKey || !localBaseUrl) return;
        setIsLoadingModels(true);
        try {
            initializeOpenAI(apiKey, localBaseUrl);
            const models = await fetchOpenAIModels();
            setOpenaiModels(models);
        } catch (error) {
            console.error('Failed to load OpenAI models:', error);
        } finally {
            setIsLoadingModels(false);
        }
    }, [apiKey, localBaseUrl]);

    // Fetch models when API key or provider changes
    useEffect(() => {
        if (apiKey && provider === 'google') {
            loadGeminiModels(apiKey);
        } else if (apiKey && provider === 'openai') {
            loadOpenAIModels();
        }
    }, [apiKey, provider, loadGeminiModels, loadOpenAIModels]);

    const handleRefreshModels = useCallback(() => {
        if (provider === 'google' && apiKey) {
            loadGeminiModels(apiKey);
        } else if (provider === 'openai') {
            loadOpenAIModels();
        }
    }, [provider, apiKey, loadGeminiModels, loadOpenAIModels]);



    const handleApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalApiKey(e.target.value);
    }, []);

    const handleBaseUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalBaseUrl(e.target.value);
    }, []);

    const handleApiKeyBlur = useCallback(() => {
        setApiKey(localApiKey);
        setTestStatus('idle');
    }, [localApiKey, setApiKey]);

    const handleBaseUrlBlur = useCallback(() => {
        updateModelConfig({ openaiBaseUrl: localBaseUrl });
    }, [localBaseUrl, updateModelConfig]);

    const handleTestConnection = useCallback(async () => {
        if (!localApiKey) return;

        setTestStatus('testing');
        setTestErrorMessage(null);
        try {
            let success = false;
            if (provider === 'google') {
                success = await testConnection(localApiKey);
                if (success) {
                    loadGeminiModels(localApiKey);
                }
            } else {
                initializeOpenAI(localApiKey, localBaseUrl);
                success = await testOpenAIConnection();
                if (success) {
                    loadOpenAIModels();
                }
            }
            setTestStatus(success ? 'success' : 'error');
            if (success) {
                setApiKey(localApiKey);
                setTestErrorMessage(null);
            } else {
                setTestErrorMessage('连接返回失败状态');
            }
        } catch (error) {
            setTestStatus('error');
            setTestErrorMessage(error instanceof Error ? error.message : '未知错误');
        }
    }, [localApiKey, localBaseUrl, provider, setApiKey, loadGeminiModels, loadOpenAIModels]);



    const handleTemperatureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateModelConfig({ temperature: parseFloat(e.target.value) });
    }, [updateModelConfig]);

    const handleTopPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateModelConfig({ topP: parseFloat(e.target.value) });
    }, [updateModelConfig]);

    const handleMaxTokensChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateModelConfig({ maxTokens: parseInt(e.target.value, 10) });
    }, [updateModelConfig]);

    // Get max output tokens for current model
    const currentModelInfo = availableModels.find(m => m.name === modelConfig.model);
    const maxOutputTokens = currentModelInfo?.outputTokenLimit || 32768;

    // Get current provider info
    const currentProvider = PROVIDER_OPTIONS.find(p => p.value === provider) || PROVIDER_OPTIONS[0];

    // Apifox project state


    // Use token from store if focused on that tab, though this component structure is a bit mixed.
    // Simplifying to just use the new apifoxToken state for that section.

    // ... existing return ...


    if (activeTab === 'api-key') {
        return (
            <div className="model-config">
                <div className="model-config__section">
                    <h2 className="model-config__title">API 配置</h2>
                    <p className="model-config__desc">
                        选择 AI 提供商并配置 API 密钥
                    </p>

                    <div className="model-config__card">
                        {/* Provider Selection */}
                        <div className="model-config__field">
                            <label className="model-config__label">AI 提供商</label>
                            <SearchableSelect
                                value={provider}
                                onChange={(val) => {
                                    const newProvider = val as AIProvider;
                                    updateModelConfig({ provider: newProvider });
                                    // Reset model to first available
                                    const firstModel = FALLBACK_MODELS[newProvider]?.[0];
                                    if (firstModel) {
                                        updateModelConfig({ model: firstModel.value });
                                    }
                                    setTestStatus('idle');
                                }}
                                options={PROVIDER_OPTIONS}
                                getValue={(opt) => opt.value}
                                getLabel={(opt) => opt.label}
                                placeholder="选择 AI 提供商"
                            />
                            <p className="model-config__hint">
                                {currentProvider.hint}
                            </p>
                        </div>

                        {/* OpenAI Base URL */}
                        {provider === 'openai' && (
                            <div className="model-config__field">
                                <label className="model-config__label">API Base URL</label>
                                <input
                                    type="text"
                                    className="model-config__input"
                                    value={localBaseUrl}
                                    onChange={handleBaseUrlChange}
                                    onBlur={handleBaseUrlBlur}
                                    placeholder="https://api.openai.com/v1"
                                />
                                <p className="model-config__hint">
                                    可自定义为其他兼容 OpenAI API 的服务地址
                                </p>
                            </div>
                        )}

                        {/* API Key */}
                        <div className="model-config__field">
                            <label className="model-config__label">
                                {provider === 'google' ? 'Gemini API Key' : 'API Key'}
                            </label>
                            <div className="model-config__input-wrapper model-config__input-wrapper--textarea">
                                <textarea
                                    className={`model-config__textarea ${testStatus === 'error' ? 'model-config__input--error' : ''} ${!showApiKey ? 'model-config__textarea--masked' : ''}`}
                                    value={localApiKey}
                                    onChange={handleApiKeyChange}
                                    onBlur={handleApiKeyBlur}
                                    placeholder="输入你的 API Key..."
                                    rows={3}
                                />
                                <button
                                    type="button"
                                    className="model-config__eye-btn model-config__eye-btn--textarea"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    title={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {provider === 'google' && (
                                <p className="model-config__hint">
                                    获取 API Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
                                </p>
                            )}
                        </div>

                        <div className="model-config__actions">
                            <button
                                className="model-config__test-btn"
                                onClick={handleTestConnection}
                                disabled={!localApiKey || testStatus === 'testing'}
                            >
                                {testStatus === 'testing' && <Loader2 size={14} className="animate-spin" />}
                                测试连接
                            </button>

                            {testStatus === 'success' && (
                                <span className="model-config__status model-config__status--success">
                                    <CheckCircle size={14} />
                                    连接成功
                                </span>
                            )}

                            {testStatus === 'error' && (
                                <div className="model-config__error-container">
                                    <span className="model-config__status model-config__status--error">
                                        <XCircle size={14} />
                                        连接失败
                                    </span>
                                    {testErrorMessage && (
                                        <p className="model-config__error-detail">{testErrorMessage}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="model-config">
            <div className="model-config__section">
                <h2 className="model-config__title">模型参数</h2>
                <p className="model-config__desc">
                    调整生成模型的参数以获得最佳效果
                </p>

                <div className="model-config__card">
                    <div className="model-config__field">
                        <label className="model-config__label">
                            <span>当前提供商</span>
                        </label>
                        <div className="model-config__provider-badge">
                            {currentProvider.label}
                        </div>
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">
                            <span>模型选择</span>
                            <button
                                className="model-config__refresh-btn"
                                onClick={handleRefreshModels}
                                disabled={isLoadingModels}
                                title="刷新模型列表"
                            >
                                <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
                            </button>
                        </label>
                        <SearchableSelect
                            value={modelConfig.model}
                            onChange={(val) => updateModelConfig({ model: val })}
                            options={
                                provider === 'google' && availableModels.length > 0
                                    ? availableModels.map(m => ({ value: m.name, label: m.displayName }))
                                    : provider === 'openai' && openaiModels.length > 0
                                        ? openaiModels.map(m => ({ value: m.id, label: m.name }))
                                        : FALLBACK_MODELS[provider]
                            }
                            getValue={(opt) => opt.value}
                            getLabel={(opt) => opt.label}
                            placeholder="选择或搜索模型"
                            disabled={isLoadingModels}
                        />
                        {currentModelInfo && (
                            <p className="model-config__hint">
                                {currentModelInfo.description.slice(0, 100)}
                                {currentModelInfo.description.length > 100 ? '...' : ''}
                            </p>
                        )}
                        {!apiKey && (
                            <p className="model-config__hint model-config__hint--warning">
                                请先配置 API Key 以获取完整模型列表
                            </p>
                        )}
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">
                            <span>Temperature (创造性)</span>
                            <span className="model-config__value">{modelConfig.temperature}</span>
                        </label>
                        <input
                            type="range"
                            className="model-config__slider"
                            min="0"
                            max="1"
                            step="0.1"
                            value={modelConfig.temperature}
                            onChange={handleTemperatureChange}
                        />
                        <p className="model-config__hint">
                            值越高，输出越有创意；值越低，输出越确定
                        </p>
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">
                            <span>Top P</span>
                            <span className="model-config__value">{modelConfig.topP}</span>
                        </label>
                        <input
                            type="range"
                            className="model-config__slider"
                            min="0"
                            max="1"
                            step="0.1"
                            value={modelConfig.topP}
                            onChange={handleTopPChange}
                        />
                    </div>

                    <div className="model-config__field">
                        <label className="model-config__label">
                            <span>最大 Token 数</span>
                            <span className="model-config__value">{modelConfig.maxTokens}</span>
                        </label>
                        <input
                            type="range"
                            className="model-config__slider"
                            min="1024"
                            max={maxOutputTokens}
                            step="1024"
                            value={Math.min(modelConfig.maxTokens, maxOutputTokens)}
                            onChange={handleMaxTokensChange}
                        />
                        {currentModelInfo && (
                            <p className="model-config__hint">
                                该模型最大支持 {currentModelInfo.outputTokenLimit.toLocaleString()} tokens
                            </p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

