// Configuration Export/Import Service
// Handles exporting and importing all application settings

import { useSettingsStore } from '../stores/settingsStore';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

// Magic header for config file identification
const CONFIG_MAGIC = 'VCODE_CFG_V1';
const CONFIG_VERSION = 1;

// Interface for exportable config
export interface ExportableConfig {
    version: number;
    exportedAt: number;
    data: {
        // Prompts
        prompts: unknown[];
        // EasyForm prompts
        easyFormSpec: string;
        easyFormIndexPrompt: string;
        easyFormModalPrompt: string;
        easyFormServicePrompt: string;
        easyFormRefinePrompt: string;
        // API config
        apiKey: string;
        modelConfig: unknown;
        // Apifox
        apifoxToken: string;
        apifoxProjects: unknown[];
        // Best examples
        bestExamples: unknown[];
        bestExamplesEnabled: boolean;
        // Proxy
        proxyRules: unknown[];
        hostGroups: unknown[];
    };
}

/**
 * Get all exportable configuration from the store
 */
export function getExportableConfig(): ExportableConfig {
    const state = useSettingsStore.getState();

    return {
        version: CONFIG_VERSION,
        exportedAt: Date.now(),
        data: {
            prompts: state.prompts,
            easyFormSpec: state.easyFormSpec,
            easyFormIndexPrompt: state.easyFormIndexPrompt,
            easyFormModalPrompt: state.easyFormModalPrompt,
            easyFormServicePrompt: state.easyFormServicePrompt,
            easyFormRefinePrompt: state.easyFormRefinePrompt,
            apiKey: state.apiKey,
            modelConfig: state.modelConfig,
            apifoxToken: state.apifoxToken,
            apifoxProjects: state.apifoxProjects,
            bestExamples: state.bestExamples,
            bestExamplesEnabled: state.bestExamplesEnabled,
            proxyRules: state.proxyRules,
            hostGroups: state.hostGroups,
        },
    };
}

/**
 * UTF-8 safe Base64 encode
 */
function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}

/**
 * UTF-8 safe Base64 decode
 */
function base64ToUtf8(base64: string): string {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

/**
 * Export configuration to a binary file using Tauri
 */
export async function exportConfig(): Promise<boolean> {
    const config = getExportableConfig();
    const jsonStr = JSON.stringify(config);
    const base64 = utf8ToBase64(jsonStr);

    // Create binary content with magic header
    const content = CONFIG_MAGIC + base64;

    // Use Tauri save dialog
    const filePath = await save({
        defaultPath: `vcode-config-${new Date().toISOString().split('T')[0]}.vconfig`,
        filters: [{
            name: 'VCode Config',
            extensions: ['vconfig']
        }]
    });

    if (!filePath) {
        return false; // User cancelled
    }

    // Write file
    await writeTextFile(filePath, content);
    return true;
}

/**
 * Import configuration from file using Tauri
 */
export async function importConfigFromDialog(): Promise<ExportableConfig | null> {
    // Use Tauri open dialog
    const filePath = await open({
        filters: [{
            name: 'VCode Config',
            extensions: ['vconfig']
        }],
        multiple: false
    });

    if (!filePath) {
        return null; // User cancelled
    }

    try {
        const content = await readTextFile(filePath as string);
        return parseConfigFile(content);
    } catch (e) {
        console.error('Failed to read config file:', e);
        return null;
    }
}

/**
 * Validate config structure
 */
function validateConfig(config: unknown): config is ExportableConfig {
    if (!config || typeof config !== 'object') return false;

    const c = config as ExportableConfig;

    // Check version
    if (typeof c.version !== 'number') return false;
    if (typeof c.exportedAt !== 'number') return false;
    if (!c.data || typeof c.data !== 'object') return false;

    // Check required fields exist
    const data = c.data;
    const requiredFields = [
        'prompts',
        'easyFormSpec',
        'easyFormIndexPrompt',
        'easyFormModalPrompt',
        'easyFormServicePrompt',
        'easyFormRefinePrompt',
        'apiKey',
        'modelConfig',
        'apifoxToken',
        'apifoxProjects',
        'bestExamples',
        'bestExamplesEnabled',
        'proxyRules',
        'hostGroups',
    ];

    for (const field of requiredFields) {
        if (!(field in data)) {
            console.error(`Missing required config field: ${field}`);
            return false;
        }
    }

    return true;
}

/**
 * Parse config file content
 */
export function parseConfigFile(content: string): ExportableConfig | null {
    // Check magic header
    if (!content.startsWith(CONFIG_MAGIC)) {
        console.error('Invalid config file: missing magic header');
        return null;
    }

    // Extract base64 content
    const base64 = content.slice(CONFIG_MAGIC.length);

    try {
        const jsonStr = base64ToUtf8(base64);
        const config = JSON.parse(jsonStr);

        if (!validateConfig(config)) {
            console.error('Invalid config file: validation failed');
            return null;
        }

        return config;
    } catch (e) {
        console.error('Failed to parse config file:', e);
        return null;
    }
}

/**
 * Read config file from File object
 */
export async function readConfigFile(file: File): Promise<ExportableConfig | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(parseConfigFile(content));
        };
        reader.onerror = () => {
            console.error('Failed to read config file');
            resolve(null);
        };
        reader.readAsText(file);
    });
}

/**
 * Apply imported configuration to the store
 */
export function applyConfig(config: ExportableConfig): void {
    const store = useSettingsStore.getState();
    const data = config.data;

    // Apply all settings
    useSettingsStore.setState({
        prompts: data.prompts as typeof store.prompts,
        easyFormSpec: data.easyFormSpec,
        easyFormIndexPrompt: data.easyFormIndexPrompt,
        easyFormModalPrompt: data.easyFormModalPrompt,
        easyFormServicePrompt: data.easyFormServicePrompt,
        easyFormRefinePrompt: data.easyFormRefinePrompt,
        apiKey: data.apiKey,
        modelConfig: data.modelConfig as typeof store.modelConfig,
        apifoxToken: data.apifoxToken,
        apifoxProjects: data.apifoxProjects as typeof store.apifoxProjects,
        bestExamples: data.bestExamples as typeof store.bestExamples,
        bestExamplesEnabled: data.bestExamplesEnabled,
        proxyRules: data.proxyRules as typeof store.proxyRules,
        hostGroups: data.hostGroups as typeof store.hostGroups,
    });
}

/**
 * Check if user has any existing configuration
 */
export function hasExistingConfig(): boolean {
    const state = useSettingsStore.getState();

    // Check if any non-default config exists
    return (
        state.apiKey !== '' ||
        state.apifoxToken !== '' ||
        state.apifoxProjects.length > 0 ||
        state.bestExamples.length > 0 ||
        state.proxyRules.length > 0 ||
        state.hostGroups.length > 0
    );
}

/**
 * Get summary of config for display
 */
export function getConfigSummary(config: ExportableConfig): {
    promptCount: number;
    hasApiKey: boolean;
    hasApifox: boolean;
    exampleCount: number;
    proxyRuleCount: number;
    hostGroupCount: number;
    exportDate: string;
} {
    const data = config.data;
    return {
        promptCount: Array.isArray(data.prompts) ? data.prompts.length : 0,
        hasApiKey: !!data.apiKey,
        hasApifox: !!data.apifoxToken || (Array.isArray(data.apifoxProjects) && data.apifoxProjects.length > 0),
        exampleCount: Array.isArray(data.bestExamples) ? data.bestExamples.length : 0,
        proxyRuleCount: Array.isArray(data.proxyRules) ? data.proxyRules.length : 0,
        hostGroupCount: Array.isArray(data.hostGroups) ? data.hostGroups.length : 0,
        exportDate: new Date(config.exportedAt).toLocaleString('zh-CN'),
    };
}
