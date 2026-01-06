import { useState } from 'react';
import { ArrowLeft, FileText, Key, Sliders, Zap, Globe, Bookmark, Network, Wifi } from 'lucide-react';
import { PromptManager } from './PromptManager';
import { ModelConfig } from './ModelConfig';
import { ApifoxConfig } from './ApifoxConfig';
import { EasyFormPrompts } from './EasyFormPrompts';
import { BestExamples } from './BestExamples';
import { ProxyConfig } from './ProxyConfig';
import { NetworkProxy } from './NetworkProxy';
import { ConfigExportImport } from './ConfigExportImport';
import './SettingsPage.css';

type SettingsTab = 'prompts' | 'easyform' | 'api-key' | 'model-config' | 'apifox-config' | 'best-examples' | 'network-proxy' | 'proxy-config';

interface SettingsPageProps {
    onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('prompts');

    const renderContent = () => {
        switch (activeTab) {
            case 'prompts':
                return <PromptManager />;
            case 'easyform':
                return <EasyFormPrompts />;
            case 'api-key':
            case 'model-config':
                return <ModelConfig activeTab={activeTab} />;
            case 'apifox-config':
                return <ApifoxConfig />;
            case 'best-examples':
                return <BestExamples />;
            case 'network-proxy':
                return <NetworkProxy />;
            case 'proxy-config':
                return <ProxyConfig />;
            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <header className="settings-page__header">
                <button className="settings-page__back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    返回
                </button>
                <h1 className="settings-page__title">系统设置</h1>
            </header>

            <div className="settings-page__content">
                <aside className="settings-page__sidebar">
                    <nav className="settings-page__nav">
                        <div className="settings-page__nav-section">
                            <div className="settings-page__nav-title">提示词</div>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'prompts' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('prompts')}
                            >
                                <FileText size={16} />
                                通用提示词
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'easyform' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('easyform')}
                            >
                                <Zap size={16} />
                                EasyForm 提示词
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'best-examples' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('best-examples')}
                            >
                                <Bookmark size={16} />
                                最佳例子
                            </button>
                        </div>

                        <div className="settings-page__nav-section">
                            <div className="settings-page__nav-title">模型配置</div>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'api-key' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('api-key')}
                            >
                                <Key size={16} />
                                API 密钥
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'model-config' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('model-config')}
                            >
                                <Sliders size={16} />
                                模型参数
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'apifox-config' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('apifox-config')}
                            >
                                <Globe size={16} />
                                Apifox 配置
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'network-proxy' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('network-proxy')}
                            >
                                <Wifi size={16} />
                                网络代理
                            </button>
                            <button
                                className={`settings-page__nav-item ${activeTab === 'proxy-config' ? 'settings-page__nav-item--active' : ''}`}
                                onClick={() => setActiveTab('proxy-config')}
                            >
                                <Network size={16} />
                                接口代理
                            </button>
                        </div>
                    </nav>

                    <ConfigExportImport />
                </aside>

                <main className="settings-page__main">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

