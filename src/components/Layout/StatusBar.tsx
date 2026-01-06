import { useSettingsStore } from '../../stores/settingsStore';
import { useGeneratorStore } from '../../stores/generatorStore';
import './StatusBar.css';

export function StatusBar() {
    const { apiKey, modelConfig } = useSettingsStore();
    const { isGenerating, progress, generatedCode } = useGeneratorStore();

    const hasApiKey = !!apiKey;
    const tokenCount = generatedCode.length;

    return (
        <footer className="status-bar">
            <div className="status-bar__left">
                <div className="status-bar__item">
                    <span
                        className={`status-bar__dot ${hasApiKey ? '' : 'status-bar__dot--warning'}`}
                    />
                    <span>{hasApiKey ? '就绪' : '未配置 API Key'}</span>
                </div>
                {isGenerating && (
                    <div className="status-bar__progress">
                        <div className="status-bar__progress-bar">
                            <div
                                className="status-bar__progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span>{Math.round(progress)}%</span>
                    </div>
                )}
            </div>
            <div className="status-bar__right">
                <div className="status-bar__item">
                    <span>模型: {modelConfig.model}</span>
                </div>
                <div className="status-bar__item">
                    <span>字符: {tokenCount}</span>
                </div>
            </div>
        </footer>
    );
}
