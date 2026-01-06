// Gemini API Service
// All API calls are routed through Tauri backend to bypass CORS restrictions

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

let geminiApiKey: string | null = null;

export function initializeGemini(apiKey: string) {
    geminiApiKey = apiKey;
}

export async function testConnection(apiKey: string): Promise<boolean> {
    try {
        await invoke('test_gemini_connection', { apiKey });
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        throw error;
    }
}

export interface GeminiModel {
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
}

interface RustGeminiModel {
    name: string;
    display_name: string;
    description: string;
    input_token_limit: number;
    output_token_limit: number;
}

export async function fetchAvailableModels(apiKey: string): Promise<GeminiModel[]> {
    try {
        const models = await invoke<RustGeminiModel[]>('fetch_gemini_models', { apiKey });

        // Convert snake_case to camelCase and add sorting
        const result: GeminiModel[] = models.map(m => ({
            name: m.name,
            displayName: m.display_name,
            description: m.description,
            inputTokenLimit: m.input_token_limit,
            outputTokenLimit: m.output_token_limit,
            supportedGenerationMethods: ['generateContent'],
        }));

        // Sort by name, prioritizing newer versions
        result.sort((a, b) => {
            const getVersion = (name: string) => {
                if (name.includes('2.0')) return 3;
                if (name.includes('1.5')) return 2;
                return 1;
            };
            return getVersion(b.name) - getVersion(a.name);
        });

        return result;
    } catch (error) {
        console.error('Failed to fetch models:', error);
        throw error;
    }
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

interface StreamChunk {
    content: string;
    done: boolean;
    error: string | null;
}

export async function* generateCodeFromImage(
    imageFile: File,
    prompts: string[],
    modelConfig: {
        model: string;
        temperature: number;
        topP: number;
        maxTokens: number;
    }
): AsyncGenerator<string, void, unknown> {
    if (!geminiApiKey) {
        throw new Error('Gemini API not initialized. Please set your API key.');
    }

    const imageBase64 = await fileToBase64(imageFile);
    const combinedPrompt = prompts.join('\n\n---\n\n');
    const fullPrompt = `${combinedPrompt}

请根据上述要求，分析这张设计图并生成相应的代码。
只输出代码，不要添加额外的解释。使用 markdown 代码块格式。`;

    // Create a queue to collect chunks
    const chunks: StreamChunk[] = [];
    let resolveWait: (() => void) | null = null;
    let unlisten: UnlistenFn | null = null;

    // Set up event listener
    unlisten = await listen<StreamChunk>('llm-chunk', (event) => {
        chunks.push(event.payload);
        if (resolveWait) {
            resolveWait();
            resolveWait = null;
        }
    });

    // Start the generation (don't await - let it run in background)
    const generatePromise = invoke('generate_code_gemini', {
        apiKey: geminiApiKey,
        model: modelConfig.model,
        prompt: fullPrompt,
        imageBase64: imageBase64,
        imageMimeType: imageFile.type,
        temperature: modelConfig.temperature,
        topP: modelConfig.topP,
        maxTokens: modelConfig.maxTokens
    }).catch((error) => {
        chunks.push({ content: '', done: true, error: String(error) });
        if (resolveWait) {
            resolveWait();
            resolveWait = null;
        }
    });

    try {
        // Process chunks as they arrive
        while (true) {
            // Wait for new chunks if queue is empty
            while (chunks.length === 0) {
                await new Promise<void>((resolve) => {
                    resolveWait = resolve;
                });
            }

            const chunk = chunks.shift()!;

            if (chunk.error) {
                throw new Error(chunk.error);
            }

            if (chunk.content) {
                yield chunk.content;
            }

            if (chunk.done) {
                break;
            }
        }
    } finally {
        if (unlisten) {
            unlisten();
        }
        await generatePromise;
    }
}

export async function parseImageDescription(
    imageFile: File,
    apiKey: string
): Promise<string> {
    const imageBase64 = await fileToBase64(imageFile);

    try {
        const result = await invoke<string>('parse_image_description', {
            apiKey,
            imageBase64,
            imageMimeType: imageFile.type
        });
        return result;
    } catch (error) {
        console.error('Image description parsing failed:', error);
        throw error;
    }
}
