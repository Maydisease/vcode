import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Wifi, WifiOff, Globe, Shield } from 'lucide-react';
import './NetworkProxy.css';

export function NetworkProxy() {
    const [systemProxyEnabled, setSystemProxyEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProxyState = async () => {
            try {
                const enabled = await invoke<boolean>('get_proxy_enabled');
                setSystemProxyEnabled(enabled);
            } catch (error) {
                console.error('Failed to fetch proxy state:', error);
            }
        };
        fetchProxyState();
    }, []);

    const handleToggle = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const newState = !systemProxyEnabled;
            await invoke('set_proxy_enabled', { enabled: newState });
            setSystemProxyEnabled(newState);
        } catch (error) {
            console.error('Failed to toggle proxy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="network-proxy">
            <div className="network-proxy__header">
                <h2 className="network-proxy__title">
                    <Globe size={20} />
                    网络代理设置
                </h2>
                <p className="network-proxy__desc">
                    控制应用程序如何连接到外部网络服务
                </p>
            </div>

            <div className="network-proxy__cards">
                {/* System Proxy Card */}
                <div
                    className={`network-proxy__card ${systemProxyEnabled ? 'network-proxy__card--active' : ''}`}
                    onClick={handleToggle}
                    role="button"
                    tabIndex={0}
                >
                    <div className="network-proxy__card-icon">
                        {systemProxyEnabled ? <Wifi size={28} /> : <WifiOff size={28} />}
                    </div>
                    <div className="network-proxy__card-content">
                        <h3>使用系统代理</h3>
                        <p>
                            {systemProxyEnabled
                                ? '已启用 - 应用将通过系统配置的代理服务器连接网络'
                                : '已禁用 - 应用将直接连接网络，绕过所有代理'
                            }
                        </p>
                    </div>
                    <div className="network-proxy__card-switch">
                        <div className={`network-proxy__switch ${systemProxyEnabled ? 'network-proxy__switch--on' : ''}`}>
                            <div className="network-proxy__switch-thumb" />
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="network-proxy__info">
                    <Shield size={16} />
                    <div>
                        <strong>什么时候需要开启系统代理？</strong>
                        <ul>
                            <li>当你使用 VPN 或代理软件访问外网时</li>
                            <li>当你需要通过公司代理访问 AI API 服务时</li>
                        </ul>
                        <strong>什么时候需要关闭系统代理？</strong>
                        <ul>
                            <li>当你需要直接连接内网服务器 (如 172.x.x.x) 时</li>
                            <li>当代理软件导致连接超时或失败时</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
